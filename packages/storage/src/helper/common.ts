import { logger } from './logger';

// @TODO: Need to handle, prevent graphql too detail
export async function isOk(callback: () => Promise<any>): Promise<boolean> {
  try {
    await callback();
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
}
