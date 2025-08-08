import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// Mock in-memory token store (in production, use Redis or database)
interface TokenData {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  timestamp: number;
}

interface TokenStore {
  [userId: string]: TokenData;
}

const tokenStore: TokenStore = {};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (userId: string): Promise<TokenData | null> => {
  const tokenData = tokenStore[userId];
  if (!tokenData || !tokenData.refreshToken) {
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
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      instance_url: instanceUrl
    } = response.data;

    // Update token store with new tokens
    const updatedTokenData: TokenData = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken || tokenData.refreshToken, // Keep old refresh token if new one not provided
      instanceUrl: instanceUrl || tokenData.instanceUrl,
      timestamp: Date.now()
    };

    tokenStore[userId] = updatedTokenData;
    
    console.log(`✅ Access token refreshed successfully for user: ${userId}`);
    return updatedTokenData;

  } catch (error) {
    console.error(`❌ Failed to refresh access token for user ${userId}:`, error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      console.error(`Status: ${statusCode}, Error:`, errorData);
    }
    
    return null;
  }
};

/**
 * Make authenticated Salesforce API call with automatic token refresh
 */
const makeSalesforceApiCall = async (
  userId: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<any> => {
  let tokenData = tokenStore[userId];
  
  if (!tokenData) {
    throw new Error('No authentication data found. Please authenticate first.');
  }

  const makeRequest = async (accessToken: string, instanceUrl: string) => {
    const url = `${instanceUrl}${endpoint}`;
    
    console.log(`🌐 Making Salesforce API call: ${method} ${url}`);
    
    return await axios({
      method,
      url,
      data,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
  };

  try {
    // First attempt with current access token
    return await makeRequest(tokenData.accessToken, tokenData.instanceUrl);
    
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log(`🔑 Access token expired, attempting refresh for user: ${userId}`);
      
      // Token expired, try to refresh
      const refreshedTokenData = await refreshAccessToken(userId);
      
      if (!refreshedTokenData) {
        throw new Error('Failed to refresh access token. Please re-authenticate.');
      }
      
      // Retry with new access token
      try {
        return await makeRequest(refreshedTokenData.accessToken, refreshedTokenData.instanceUrl);
      } catch (retryError) {
        console.error(`❌ API call failed even after token refresh:`, retryError);
        throw retryError;
      }
    } else {
      // Non-401 error, throw as-is
      throw error;
    }
  }
};

/**
 * GET /salesforce/me
 * Get current user information from Salesforce
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user';
    
    console.log(`👤 Fetching user info for: ${userId}`);
    
    // Try userinfo endpoint first (simpler and doesn't require user ID)
    let userResponse;
    
    try {
      userResponse = await makeSalesforceApiCall(
        userId,
        '/services/oauth2/userinfo'
      );
    } catch (userinfoError) {
      console.log(`ℹ️ Userinfo endpoint failed, trying User sobject...`);
      
      // Fallback to User sobject (requires knowing the user ID)
      // First get the user ID from the token validation
      try {
        const tokenValidation = await makeSalesforceApiCall(
          userId,
          '/services/oauth2/userinfo'
        );
        
        const salesforceUserId = tokenValidation.data.user_id;
        
        userResponse = await makeSalesforceApiCall(
          userId,
          `/services/data/v58.0/sobjects/User/${salesforceUserId}`
        );
      } catch (fallbackError) {
        throw userinfoError; // Throw original error if fallback also fails
      }
    }
    
    const userData = userResponse.data;
    
    console.log(`✅ Successfully retrieved user info for: ${userData.name || userData.display_name}`);
    
    // Return standardized user data
    res.status(200).json({
      success: true,
      user: {
        id: userData.user_id || userData.Id,
        name: userData.name || userData.display_name || `${userData.first_name} ${userData.last_name}`,
        email: userData.email || userData.Email,
        username: userData.preferred_username || userData.Username,
        organization: userData.organization_id || userData.CompanyName,
        profile: userData.profile || userData.Profile?.Name,
        isActive: userData.is_active !== false && userData.IsActive !== false,
        lastLoginDate: userData.last_modified_date || userData.LastLoginDate,
        timezone: userData.timezone || userData.TimeZoneSidKey,
        locale: userData.locale || userData.LocaleSidKey,
        language: userData.language || userData.LanguageLocaleKey
      },
      instanceUrl: tokenStore[userId]?.instanceUrl,
      retrievedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching Salesforce user info:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorData = error.response?.data;
      
      return res.status(statusCode).json({
        success: false,
        error: 'Failed to fetch user information',
        message: errorData?.error_description || error.message,
        details: errorData
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /salesforce/org
 * Get organization information from Salesforce
 */
router.get('/org', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user';
    
    console.log(`🏢 Fetching organization info for user: ${userId}`);
    
    const orgResponse = await makeSalesforceApiCall(
      userId,
      '/services/data/v58.0/query/?q=SELECT+Id,Name,OrganizationType,IsSandbox,InstanceName,NamespacePrefix+FROM+Organization+LIMIT+1'
    );
    
    const orgData = orgResponse.data.records[0];
    
    if (!orgData) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        message: 'Could not retrieve organization information'
      });
    }
    
    console.log(`✅ Successfully retrieved org info: ${orgData.Name}`);
    
    res.status(200).json({
      success: true,
      organization: {
        id: orgData.Id,
        name: orgData.Name,
        type: orgData.OrganizationType,
        isSandbox: orgData.IsSandbox,
        instanceName: orgData.InstanceName,
        namespacePrefix: orgData.NamespacePrefix
      },
      instanceUrl: tokenStore[userId]?.instanceUrl,
      retrievedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching Salesforce org info:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorData = error.response?.data;
      
      return res.status(statusCode).json({
        success: false,
        error: 'Failed to fetch organization information',
        message: errorData?.error_description || error.message,
        details: errorData
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to set token data (for integration with existing OAuth flow)
 */
export const setTokenData = (userId: string, tokenData: TokenData): void => {
  tokenStore[userId] = tokenData;
  console.log(`💾 Token data stored for user: ${userId}`);
};

/**
 * Helper function to get token data
 */
export const getTokenData = (userId: string): TokenData | null => {
  return tokenStore[userId] || null;
};

/**
 * Helper function to clear token data
 */
export const clearTokenData = (userId: string): void => {
  delete tokenStore[userId];
  console.log(`🗑️ Token data cleared for user: ${userId}`);
};

export default router;