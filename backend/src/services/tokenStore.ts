import redis from '../config/redis';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  expiresAt: number; // UNIX timestamp in ms
}

const REDIS_PREFIX = 'kublish:token';

const isRedisConnected = () => redis.status === 'ready';

/**
 * Save token data to Redis with optional TTL
 */
export const setTokenData = async (userId: string, token: TokenData): Promise<void> => {
  const key = `${REDIS_PREFIX}:${userId}`;
  const ttl = token.expiresAt - Date.now(); // ms until expiration

  if (isRedisConnected()) {
    await redis.set(key, JSON.stringify(token), 'PX', ttl);
  } else {
    console.warn('⚠️ Redis unavailable, token not persisted.');
  }
};

/**
 * Get token data from Redis
 */
export const getTokenData = async (userId: string): Promise<TokenData | null> => {
  const key = `${REDIS_PREFIX}:${userId}`;

  if (isRedisConnected()) {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
  }
  return null;
};

/**
 * Clear token data from Redis
 */
export const clearTokenData = async (userId: string): Promise<void> => {
  const key = `${REDIS_PREFIX}:${userId}`;
  if (isRedisConnected()) {
    await redis.del(key);
  }
};
