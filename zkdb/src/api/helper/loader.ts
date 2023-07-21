import config from './config.js';
import { StorageEngineIPFS } from '../../storage-engine/ipfs.js';
import { Metadata } from '../../storage-engine/metadata.js';

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
    const instance = await StorageEngineIPFS.getInstance(config.dataLocation);
    await instance.tryResolve();
    return instance;
  });

export const getMetadata = async () =>
  loadInstance<Metadata>('storageEngine', async () => {
    return Metadata.load(await getStorageEngine(), 64);
  });

export default {
  getStorageEngine,
  getMetadata,
};
