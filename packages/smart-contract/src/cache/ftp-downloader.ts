import * as ftp from 'basic-ftp';
import { promises as fs } from 'fs';
import { join } from 'path';

export const downloadFile = async (
  client: ftp.Client,
  remotePath: string,
  localPath: string
) => {
  await fs.mkdir(join(localPath, '..'), { recursive: true });
  await client.downloadTo(localPath, remotePath);
};

export const downloadDirectory = async (
  client: ftp.Client,
  remoteDir: string,
  localDir: string
) => {
  await fs.mkdir(localDir, { recursive: true });
  const list = await client.list(remoteDir);
  for (const item of list) {
    const remotePath = join(remoteDir, item.name).replace(/\\/g, '/');
    const localPath = join(localDir, item.name);

    if (item.isDirectory) {
      await downloadDirectory(client, remotePath, localPath);
    } else {
      await downloadFile(client, remotePath, localPath);
    }
  }
};
