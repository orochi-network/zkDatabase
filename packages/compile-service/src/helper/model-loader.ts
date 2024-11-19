import {
  DatabaseEngine,
  ModelDbSetting,
  ModelDbTransaction,
  ModelProof,
  ModelSecureStorage,
} from "@zkdb/storage";
import { config } from "./config";

export async function initModelLoader() {
  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  ModelDbTransaction.createModel(serviceDb);
  ModelDbSetting.createModel(serviceDb);
  ModelProof.createModel(proofDb);
  ModelSecureStorage.createModel(proofDb);
}
