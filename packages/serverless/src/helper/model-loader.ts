import {
  DatabaseEngine,
  ModelDatabase,
  ModelDbSetting,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
  ModelSecureStorage,
  TransactionManager,
} from '@zkdb/storage';
import config from './config.js';

export const DB_INSTANCE = {
  proof: DatabaseEngine.getInstance(config.PROOF_MONGODB_URL),
  service: DatabaseEngine.getInstance(config.MONGODB_URL),
};

export async function initModelLoader() {
  const { service: serviceDb, proof: proofDb } = DB_INSTANCE;

  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  TransactionManager.addSession(
    {
      name: 'proof',
      session: proofDb.client.startSession(),
    },
    {
      name: 'service',
      session: serviceDb.client.startSession(),
    }
  );

  ModelDatabase.createModel(serviceDb);
  ModelDbSetting.createModel(serviceDb);
  ModelMerkleTree.createModel(serviceDb);
  ModelQueueTask.createModel(proofDb);
  ModelProof.createModel(proofDb);
  ModelSecureStorage.createModel(proofDb);
}
