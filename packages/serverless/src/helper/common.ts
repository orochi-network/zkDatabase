import logger from './logger';

export interface AppContext {
  username: string;
  email: string;
  sessionId: string;
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
