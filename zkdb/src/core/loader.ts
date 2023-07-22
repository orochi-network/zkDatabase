import config from '../api/helper/config.js';
import { StorageEngineIPFS } from '../storage-engine/ipfs.js';
import { Metadata } from '../storage-engine/metadata.js';

const singleton: { [key: string]: any } = {};

async function loadInstance<T>(
  instance: string,
  async: () => Promise<T>
): Promise<T> {
  if (typeof singleton[instance] === 'undefined') {
    singleton[instance] = await async();
  }
  return singleton[instance];
}

export const getStorageEngine = async () =>
  loadInstance<StorageEngineIPFS>('storage-engine-ipfs', async () => {
    return StorageEngineIPFS.getInstance(config.dataLocation);
  });

export const getMetadata = async (merkleHeight: number) =>
  loadInstance<Metadata>('storageEngine', async () => {
    /**
     * @todo Should load default height from configuration
     */
    return Metadata.load(await getStorageEngine(), merkleHeight);
  });

export default {
  getStorageEngine,
  getMetadata,
};
