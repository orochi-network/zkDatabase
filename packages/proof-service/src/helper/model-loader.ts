import {
  DatabaseEngine,
  ModelDbSetting,
  ModelDbTransaction,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
  ModelSecureStorage,
  TransactionManager,
} from '@zkdb/storage';
import { config } from './config.js';

export async function initModelLoader() {
  // db service
  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  // db proof
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);
  console.log('🚀 ~ initModelLoader ~ L:', config.PROOF_MONGODB_URL);
  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  TransactionManager.addSession({
    name: 'proof',
    session: proofDb.client.startSession(),
  });
  console.log('🚀 ~ initModelLoader ~ TransactionManager:', TransactionManager);

  ModelDbSetting.createModel(serviceDb);
  ModelMerkleTree.createModel(serviceDb);
  ModelQueueTask.createModel(proofDb);
  ModelProof.createModel(proofDb);
}
