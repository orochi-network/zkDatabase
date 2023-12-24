import logger from './logger';

export interface AppContext {
  sessionId?: string;
}

export async function isOk(callback: () => Promise<any>): Promise<boolean> {
  try {
    await callback();
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
}
