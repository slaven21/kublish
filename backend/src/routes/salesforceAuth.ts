import express, { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

// Mock in-memory stores (in production, use Redis or database)
interface SessionStore {
  [userId: string]: {
    state: string;
    timestamp: number;
  };
}

interface TokenStore {
  [userId: string]: {
    accessToken: string;
    refreshToken: string;
    instanceUrl: string;
    timestamp: number;
  };
}

const sessionStore: SessionStore = {};
const tokenStore: TokenStore = {};

// Clean up expired sessions (older than 10 minutes)
const cleanupExpiredSessions = () => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  
  Object.keys(sessionStore).forEach(userId => {
    if (now - sessionStore[userId].timestamp > tenMinutes) {
      delete sessionStore[userId];
    }
  });
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

/**
 * GET /auth/salesforce/initiate
 * Initiates Salesforce OAuth flow by redirecting to Salesforce login
 */
router.get('/initiate', async (req: Request, res: Response) => {
  try {
    // Generate secure random state string
    const state = crypto.randomBytes(16).toString('hex');
    
    // Mock user ID (in production, get from authenticated session)
    const userId = req.query.userId as string || 'default-user';
    
    // Store state in session store with timestamp
    sessionStore[userId] = {
      state,
      timestamp: Date.now()
    };
    
    // Build Salesforce OAuth URL
    const salesforceAuthUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
    salesforceAuthUrl.searchParams.append('response_type', 'code');
    salesforceAuthUrl.searchParams.append('client_id', process.env.SF_CLIENT_ID!);
    salesforceAuthUrl.searchParams.append('redirect_uri', process.env.SF_REDIRECT_URI!);
    salesforceAuthUrl.searchParams.append('scope', 'api refresh_token');
    salesforceAuthUrl.searchParams.append('state', state);
    
    console.log(`🔐 Initiating Salesforce OAuth for user: ${userId}`);
    console.log(`📍 Redirecting to: ${salesforceAuthUrl.toString()}`);
    
    // Redirect to Salesforce OAuth
    res.redirect(salesforceAuthUrl.toString());
    
  } catch (error) {
    console.error('❌ Error initiating Salesforce OAuth:', error);
    res.status(500).json({
      error: 'Failed to initiate Salesforce authentication',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /auth/salesforce/callback
 * Handles Salesforce OAuth callback and exchanges code for tokens
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    
    // Check for OAuth errors
    if (error) {
      console.error('❌ Salesforce OAuth error:', error);
      return res.status(400).json({
        error: 'Salesforce authentication failed',
        details: error
      });
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Authorization code and state are required'
      });
    }
    
    // Mock user ID (in production, extract from state or session)
    const userId = 'default-user';
    
    // Validate state parameter
    const storedSession = sessionStore[userId];
    if (!storedSession || storedSession.state !== state) {
      console.error('❌ Invalid state parameter');
      return res.status(400).json({
        error: 'Invalid state parameter',
        message: 'Possible CSRF attack detected'
      });
    }
    
    // Clean up used state
    delete sessionStore[userId];
    
    console.log(`🔄 Exchanging authorization code for tokens...`);
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://login.salesforce.com/services/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SF_CLIENT_ID!,
        client_secret: process.env.SF_CLIENT_SECRET!,
        redirect_uri: process.env.SF_REDIRECT_URI!,
        code: code as string
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      instance_url: instanceUrl
    } = tokenResponse.data;
    
    // Validate response
    if (!accessToken || !instanceUrl) {
      throw new Error('Invalid token response from Salesforce');
    }
    
    // Store tokens in mock encrypted store
    tokenStore[userId] = {
      accessToken,
      refreshToken,
      instanceUrl,
      timestamp: Date.now()
    };
    
    console.log(`✅ Salesforce authentication successful for user: ${userId}`);
    console.log(`🏢 Instance URL: ${instanceUrl}`);
    
    // Success response
    res.status(200).json({
      message: 'Salesforce connected successfully',
      instanceUrl,
      connectedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in Salesforce callback:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorData = error.response?.data;
      
      return res.status(statusCode).json({
        error: 'Failed to exchange authorization code',
        message: errorData?.error_description || error.message,
        details: errorData
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /auth/salesforce/status
 * Check current Salesforce connection status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user';
    const tokens = tokenStore[userId];
    
    if (!tokens) {
      return res.status(200).json({
        connected: false,
        message: 'No Salesforce connection found'
      });
    }
    
    // Check if tokens are still valid (basic timestamp check)
    const oneHour = 60 * 60 * 1000;
    const isExpired = Date.now() - tokens.timestamp > oneHour;
    
    res.status(200).json({
      connected: !isExpired,
      instanceUrl: tokens.instanceUrl,
      connectedAt: new Date(tokens.timestamp).toISOString(),
      expired: isExpired
    });
    
  } catch (error) {
    console.error('❌ Error checking Salesforce status:', error);
    res.status(500).json({
      error: 'Failed to check connection status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/salesforce/disconnect
 * Disconnect from Salesforce (clear stored tokens)
 */
router.post('/disconnect', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user';
    
    // Clear stored tokens
    delete tokenStore[userId];
    delete sessionStore[userId];
    
    console.log(`🔌 Salesforce disconnected for user: ${userId}`);
    
    res.status(200).json({
      message: 'Salesforce disconnected successfully'
    });
    
  } catch (error) {
    console.error('❌ Error disconnecting Salesforce:', error);
    res.status(500).json({
      error: 'Failed to disconnect',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;