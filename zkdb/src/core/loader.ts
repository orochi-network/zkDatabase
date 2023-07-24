import config from '../api/helper/config.js';
import {
  StorageEngineLocal,
  StorageEngineIPFS,
  StorageEngine,
} from '../storage-engine/index.js';
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

export const getIPFSStorageEngine = async () =>
  loadInstance<StorageEngineIPFS>('storage-engine-ipfs', async () => {
    return StorageEngineIPFS.getInstance(config.dataLocation);
  });

export const getLocalStorageEngine = async () =>
  loadInstance<StorageEngineLocal>('storage-engine-local', async () => {
    return StorageEngineLocal.getInstance(`${config.dataLocation}/local`);
  });

export const getMetadata = async (
  storageEngine: StorageEngine,
  merkleHeight: number
) =>
  loadInstance<Metadata>('storageEngine', async () => {
    /**
     * @todo Should load default height from configuration
     */
    return Metadata.load(storageEngine, merkleHeight);
  });

export default {
  getIPFSStorageEngine,
  getLocalStorageEngine,
  getMetadata,
};
