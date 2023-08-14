import { StorageEngineDelegatedIPFS } from '../storage-engine/delegated-ipfs.js';
import { StorageEngineLocal, StorageEngine } from '../storage-engine/index.js';
import { Metadata } from '../storage-engine/metadata.js';

const singleton: { [key: string]: any } = {};

export async function loadInstance<T>(
  instance: string,
  async: () => Promise<T>
): Promise<T> {
  if (typeof singleton[instance] === 'undefined') {
    singleton[instance] = await async();
  }
  return singleton[instance];
}

export const getLocalStorageEngine = async (dataLocation: string) =>
  loadInstance<StorageEngineLocal>('storage-engine-local', async () => {
    return StorageEngineLocal.getInstance(`${dataLocation}/local`);
  });

export const getDelegatedIPFSStorageEngine = async (dataLocation: string) =>
  loadInstance<StorageEngineDelegatedIPFS>(
    'storage-engine-delegated-ipfs',
    async () => {
      return StorageEngineDelegatedIPFS.getInstance(
        `${dataLocation.replace(/^\./, '')}`
      );
    }
  );

export const getMetadata = async (
  storageEngine: StorageEngine,
  merkleHeight: number
) =>
  loadInstance<Metadata>('metadata', async () => {
    /**
     * @todo Should load default height from configuration
     */
    return Metadata.getInstance(storageEngine, merkleHeight);
  });

export default {
  getDelegatedIPFSStorageEngine,
  getLocalStorageEngine,
  getMetadata,
};
