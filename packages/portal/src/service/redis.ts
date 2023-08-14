import { jwtExpired } from '../helper/jwt';
import logger from '../helper/logger';
import RedisInstance from '../helper/redis';

const cluster = 'user-using-tokens';

const getCacheKey = (userId: number) => `${cluster}/user-${userId}`;

const getTokenKey = (userId: number, token: string | undefined) =>
  `${cluster}/user-${userId}-token-${token}`;

export const saveCacheToken = async (userId: number, token: string) => {
  try {
    const key = getCacheKey(userId);
    return RedisInstance.listPush(key, token);
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const removeCacheToken = async (userId: number, token: string) => {
  try {
    const key = getCacheKey(userId);
    return RedisInstance.listRemoveItem(key, token);
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getUserCacheTokens = async (userId: number) => {
  try {
    const key = getCacheKey(userId);
    return RedisInstance.listGetAll(key);
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const revokeToken = async (
  userId: number,
  token: string | undefined
) => {
  try {
    const key = getTokenKey(userId, token);
    const expiredAt = new Date(Date.now() + jwtExpired * 1000);
    const value = JSON.stringify({
      expired_at: expiredAt,
    });
    if (token) await removeCacheToken(userId, token);
    return RedisInstance.setEx(key, jwtExpired, value);
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const revokeAllUserToken = async (userId: number) => {
  try {
    const tokens = (await getUserCacheTokens(userId)) || [];
    return Promise.all(tokens.map((token) => revokeToken(userId, token)));
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const isRevokedToken = async (
  userId: number,
  token: string | undefined
) => {
  try {
    const key = getTokenKey(userId, token);
    const record = await RedisInstance.get(key);
    return !!record;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
