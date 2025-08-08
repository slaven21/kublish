// backend/src/routes/salesforceAuth.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Environment validation
const requiredEnvVars = ['SF_CLIENT_ID', 'SF_CLIENT_SECRET', 'SF_REDIRECT_URI'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Mock secure token/session stores (replace with Redis or DB in prod)
interface SessionStore {
  [state: string]: {
    userId: string;
    timestamp: number;
  };
}

interface TokenStore {
  [userId: string]: {
    accessToken: string;
    refreshToken?: string;
    instanceUrl: string;
    expiresAt: number;
  };
}

const sessionStore: SessionStore = {};
const tokenStore: TokenStore = {};

const OAUTH_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 min safety buffer

const cleanupExpiredSessions = () => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  Object.entries(sessionStore).forEach(([state, { timestamp }]) => {
    if (now - timestamp > tenMinutes) {
      delete sessionStore[state];
    }
  });
};
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// Rate limiter for public routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
});

router.use(authLimiter);

router.get('/initiate', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const state = crypto.randomBytes(16).toString('hex');
  sessionStore[state] = { userId, timestamp: Date.now() };

  const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', process.env.SF_CLIENT_ID!);
  authUrl.searchParams.append('redirect_uri', process.env.SF_REDIRECT_URI!);
  authUrl.searchParams.append('scope', 'api refresh_token');
  authUrl.searchParams.append('state', state);

  res.redirect(authUrl.toString());
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  if (error) return res.status(400).json({ error: 'Salesforce OAuth error', details: error });
  if (!code || !state) return res.status(400).json({ error: 'Missing code or state' });

  const session = sessionStore[state as string];
  if (!session) return res.status(400).json({ error: 'Invalid or expired state' });

  const { userId } = session;
  delete sessionStore[state as string];

  try {
    const tokenRes = await axios.post(
      'https://login.salesforce.com/services/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SF_CLIENT_ID!,
        client_secret: process.env.SF_CLIENT_SECRET!,
        redirect_uri: process.env.SF_REDIRECT_URI!,
        code: code as string
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, instance_url, issued_at, expires_in } = tokenRes.data;
    if (!access_token || !instance_url) throw new Error('Invalid token response');

    const expiresAt = Date.now() + parseInt(expires_in || '3600', 10) * 1000 - OAUTH_EXPIRY_BUFFER;
    tokenStore[userId] = {
      accessToken: access_token,
      refreshToken: refresh_token,
      instanceUrl: instance_url,
      expiresAt,
    };

    res.status(200).json({
      message: 'Salesforce connected successfully',
      instanceUrl: instance_url,
      connectedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const { status, data } = err.response || {};
      return res.status(status || 500).json({
        error: 'Token exchange failed',
        message: data?.error_description || err.message,
        details: data,
      });
    }
    res.status(500).json({ error: 'Callback error', message: (err as Error).message });
  }
});

router.get('/status', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const tokens = tokenStore[userId];
  if (!tokens) {
    return res.status(200).json({ connected: false, message: 'No Salesforce connection found' });
  }

  const isExpired = Date.now() > tokens.expiresAt;
  res.status(200).json({
    connected: !isExpired,
    instanceUrl: tokens.instanceUrl,
    connectedAt: new Date(tokens.expiresAt - 3600000).toISOString(),
    expired: isExpired,
  });
});

router.post('/disconnect', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  delete tokenStore[userId];
  Object.keys(sessionStore).forEach(state => {
    if (sessionStore[state].userId === userId) delete sessionStore[state];
  });

  res.status(200).json({ message: 'Disconnected from Salesforce' });
});

export default router;
