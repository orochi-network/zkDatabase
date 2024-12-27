import Joi from 'joi';
import { logger } from './logger';

export async function isOk(callback: () => Promise<any>): Promise<boolean> {
  try {
    await callback();
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
}

const cache: {
  timestamp?: Date;
} = {};

export function getCurrentTime(): Date {
  if (typeof cache.timestamp === 'undefined') {
    cache.timestamp = new Date();
    // Clear cache every 2 secs
    setTimeout(() => {
      delete cache.timestamp;
    }, 2000);
  }
  return cache.timestamp;
}
