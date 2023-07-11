import config from './config.js';
import { StorageEngineIPFS } from '../../storage-engine/index.js';

const instanceStorage: { [key: string]: StorageEngineIPFS } = {};

export const getStorageEngine = async () => {
  if (typeof instanceStorage.storage === 'undefined') {
    let dataLocation = 'data';
    if (config.dataLocation !== undefined) {
      dataLocation = config.dataLocation;
    }
    instanceStorage.storage = await StorageEngineIPFS.getInstance(dataLocation);
    // Make sure metadata is created
    await instanceStorage.storage.tryResolve();
  }
  return instanceStorage.storage;
};

export default getStorageEngine;
