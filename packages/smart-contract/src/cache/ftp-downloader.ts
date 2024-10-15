import type { Client } from 'basic-ftp';
import { getNodeDependencies } from 'src/helper/environment';

export const downloadFile = async (
  client: Client,
  remotePath: string,
  localPath: string
) => {
  const node = await getNodeDependencies();
  if (node) {
    await node.fs.mkdir(node.path.join(localPath, '..'), { recursive: true });
    await client.downloadTo(localPath, remotePath);
  }
};

export const downloadDirectory = async (
  client: Client,
  remoteDir: string,
  localDir: string
) => {
  const node = await getNodeDependencies();
  if (node) {
    await node.fs.mkdir(localDir, { recursive: true });
    const list = await client.list(remoteDir);
    for (const item of list) {
      const remotePath = node.path
        .join(remoteDir, item.name)
        .replace(/\\/g, '/');
      const localPath = node.path.join(localDir, item.name);

      if (item.isDirectory) {
        await downloadDirectory(client, remotePath, localPath);
      } else {
        await downloadFile(client, remotePath, localPath);
      }
    }
  }
};
