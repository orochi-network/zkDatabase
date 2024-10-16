import { CacheType } from '@types';
import { Cache } from 'o1js';
import { getNodeDependencies } from '../helper/environment';
import { downloadCache } from './cache-downloader';

export const DOWNLOADS = 'downloads';

export class CacheManager {
  static async provideCache(
    type: CacheType,
    merkleHeight: number
  ): Promise<Cache> {
    const node = await getNodeDependencies();

    if (node) {
      // TODO: Check cache to avoid redownloaded
      const identifier = node.path.join(type, merkleHeight.toString());
      await downloadCache(DOWNLOADS, identifier);

      const cachePath = node.path.join(DOWNLOADS, identifier);

      return Cache.FileSystem(cachePath);
    } else {
      return Cache.None;
    }
  }
}
