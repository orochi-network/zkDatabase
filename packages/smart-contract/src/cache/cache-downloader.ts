import { CacheType } from '../types/cache-type.js';
import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import { downloadDirectory } from './ftp-downloader.js';

export async function downloadCache(
  baseDestinationPath: string,
  identifier: string
): Promise<boolean> {
  const client = new ftp.Client();

  try {
    // TODO: Use config
    await client.access({
      host: '127.0.0.1',
      port: 2121,
      user: 'anonymous',
      password: 'anonymous@',
      secure: false,
    });

    // TODO: Use config
    const localMetadataPath = path.join(baseDestinationPath, identifier);

    await downloadDirectory(client, identifier, localMetadataPath);

    // TODO: Check success
    return true;
  } catch {
    return false;
  } finally {
    client.close();
  }
}
