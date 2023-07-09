import { StorageEngineIPFS } from '../../storage-engine/index.js';

const instanceStorage: { [key: string]: StorageEngineIPFS } = {};

export const getStorageEngine = async () => {
  if (typeof instanceStorage.storage === 'undefined') {
    instanceStorage.storage = await StorageEngineIPFS.getInstance('data');
    // Make sure metadata is created
    await instanceStorage.storage.tryResolve();
  }
  return instanceStorage.storage;
};

export default getStorageEngine;
