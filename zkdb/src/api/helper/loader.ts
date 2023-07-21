import config from './config.js';
import { StorageEngineIPFS } from '../../storage-engine/ipfs.js';
import { Metadata } from '../../storage-engine/metadata.js';
import logger from './logger.js';

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
    logger.debug('Storage data location:', config.dataLocation);
    return StorageEngineIPFS.getInstance(config.dataLocation);
  });

export const getMetadata = async () =>
  loadInstance<Metadata>('storageEngine', async () => {
    /**
     * @todo Should load default height from configuration
     */
    return Metadata.load(await getStorageEngine(), 64);
  });

export default {
  getStorageEngine,
  getMetadata,
};
