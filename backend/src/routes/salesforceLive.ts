import express, { Request, Response } from 'express';
import axios from 'axios';
import {
  getTokenData,
  setTokenData,
  clearTokenData,
  TokenData
} from '../services/tokenStore';

const router = express.Router();

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (userId: string): Promise<TokenData | null> => {
  const tokenData = await getTokenData(userId);
  if (!tokenData?.refreshToken) {
    console.error(`❌ No refresh token found for user: ${userId}`);
    return null;
  }

  try {
    console.log(`🔄 Refreshing access token for user: ${userId}`);

    const response = await axios.post(
      'https://login.salesforce.com/services/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SF_CLIENT_ID!,
        client_secret: process.env.SF_CLIENT_SECRET!,
        refresh_token: tokenData.refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    const {
      access_token,
      refresh_token,
      instance_url,
      issued_at,
      expires_in
    } = response.data;

    const expiresAt = Date.now() + (parseInt(expires_in || '3600') * 1000); // Fallback 1h

    const updatedToken: TokenData = {
      accessToken: access_token,
      refreshToken: refresh_token || tokenData.refreshToken,
      instanceUrl: instance_url || tokenData.instanceUrl,
      expiresAt
    };

    await setTokenData(userId, updatedToken);
    console.log(`✅ Access token refreshed for ${userId}`);
    return updatedToken;

  } catch (err) {
    console.error(`❌ Failed to refresh token for ${userId}:`, err);
    return null;
  }
};

const makeSalesforceApiCall = async (
  userId: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<any> => {
  let tokenData = await getTokenData(userId);
  if (!tokenData) throw new Error('User is not authenticated with Salesforce.');

  const now = Date.now();
  if (tokenData.expiresAt < now + 30000) { // refresh if < 30s left
    tokenData = await refreshAccessToken(userId);
    if (!tokenData) throw new Error('Unable to refresh token.');
  }

  const url = `${tokenData.instanceUrl}${endpoint}`;

  return axios({
    method,
    url,
    data,
    headers: {
      Authorization: `Bearer ${tokenData.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    timeout: 15000
  });
};

/**
 * GET /salesforce/me
 */
router.get('/me', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const userResp = await makeSalesforceApiCall(userId, '/services/oauth2/userinfo');
    const userData = userResp.data;

    res.status(200).json({
      success: true,
      user: {
        id: userData.user_id,
        name: userData.name || `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        username: userData.preferred_username,
        organization: userData.organization_id,
        isActive: userData.is_active !== false,
        lastLoginDate: userData.last_modified_date,
        timezone: userData.timezone,
        locale: userData.locale,
        language: userData.language
      },
      instanceUrl: (await getTokenData(userId))?.instanceUrl,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ /me error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

/**
 * GET /salesforce/org
 */
router.get('/org', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const orgResp = await makeSalesforceApiCall(
      userId,
      '/services/data/v58.0/query/?q=SELECT+Id,Name,OrganizationType,IsSandbox,InstanceName,NamespacePrefix+FROM+Organization+LIMIT+1'
    );

    const org = orgResp.data.records?.[0];
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    res.status(200).json({
      success: true,
      organization: {
        id: org.Id,
        name: org.Name,
        type: org.OrganizationType,
        isSandbox: org.IsSandbox,
        instanceName: org.InstanceName,
        namespacePrefix: org.NamespacePrefix
      },
      instanceUrl: (await getTokenData(userId))?.instanceUrl,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ /org error:', error);
    res.status(500).json({ error: 'Failed to fetch org info' });
  }
});

export default router;
