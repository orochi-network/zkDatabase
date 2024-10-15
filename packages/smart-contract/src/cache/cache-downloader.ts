import { getNodeDependencies } from 'src/helper/environment.js';
import { downloadDirectory } from './ftp-downloader.js';

export async function downloadCache(
  baseDestinationPath: string,
  identifier: string
): Promise<boolean> {
  const node = await getNodeDependencies();
  if (node) {
    const client = new node.ftp.Client();
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
      const localMetadataPath = node.path.join(baseDestinationPath, identifier);

      await downloadDirectory(client, identifier, localMetadataPath);

      // TODO: Check success
      return true;
    } catch {
      return false;
    } finally {
      client.close();
    }
  }
  return false;
}
