import { Cache } from 'o1js';
import { CacheType } from '@types';
import { join } from 'path';
import { downloadCache } from './cache-downloader';

export const DOWNLOADS = 'downloads';

export class CacheManager {
  static async provideCache(
    type: CacheType,
    merkleHeight: number
  ): Promise<Cache> {
    // TODO: Check cache to avoid redownloaded
    const identifier = join(type, merkleHeight.toString());
    await downloadCache(DOWNLOADS, identifier);

    const cachePath = join(DOWNLOADS, identifier);

    return Cache.FileSystem(cachePath);
  }
}
