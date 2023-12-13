import logger from "./logger";

export interface AppContext {
  token?: string;
  userId?: number;
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