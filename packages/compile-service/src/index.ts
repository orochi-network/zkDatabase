import { logger } from "@helper";
import { EncryptionKey } from "@orochi-network/vault";
import { UnsignedTransaction, ZkCompileService } from "@service";
import {
  DatabaseEngine,
  ModelDbSetting,
  ModelDbTransaction,
  ModelProof,
  ModelSecureStorage,
} from "@zkdb/storage";
import { Mina, PrivateKey, PublicKey } from "o1js";
import { config } from "./helper/config";
import { RedisQueueService } from "./message-queue";
import { setTimeout } from "timers/promises";

export type TransactionType = "deploy" | "rollup";

export type DbTransactionQueue = {
  id: string;
  payerAddress: string;
};

async function findTransactionWithRetry(
  modelTransaction: ModelDbTransaction,
  id: string,
  maxWaitTimeMs = 3000,
  intervalMs = 500
) {
  const startTime = Date.now();
  let tx = null;

  while (Date.now() - startTime < maxWaitTimeMs) {
    tx = await modelTransaction.findById(id);

    if (tx) {
      return tx;
    }

    await setTimeout(intervalMs);
  }

  logger.error(
    `Transaction ${id} has not been found after ${maxWaitTimeMs} ms`
  );
  return null;
}

async function processQueue(redisQueue: RedisQueueService<DbTransactionQueue>) {
  const zkAppCompiler = new ZkCompileService({
    networkId: config.NETWORK_ID,
    mina: config.MINA_URL,
  });

  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

  if (!serviceDb.isConnected()) await serviceDb.connect();
  if (!proofDb.isConnected()) await proofDb.connect();

  const modelTransaction = ModelDbTransaction.getInstance();
  const modelDbSettings = ModelDbSetting.getInstance();

  while (true) {
    try {
      const request = await redisQueue.dequeue();
      if (!request) {
        await setTimeout(1000); // Prevent busy looping when the queue is empty
        continue;
      }

      const tx = await findTransactionWithRetry(modelTransaction, request.id);

      if (!tx) {
        logger.error(`Transaction ${request.id} has not been found`);
        continue;
      }

      const dbSettings = await modelDbSettings.getSetting(tx.databaseName);
      if (!dbSettings) {
        logger.error(`Settings for ${tx.databaseName} have not been found`);
        continue;
      }

      logger.info(`Received ${tx.databaseName} to queue`);

      const secureStorage = ModelSecureStorage.getInstance();
      let transaction: UnsignedTransaction;
      let zkAppPublicKey: string;

      if (tx.transactionType === "deploy") {
        const zkAppPrivateKey = PrivateKey.random();
        zkAppPublicKey = PublicKey.fromPrivateKey(zkAppPrivateKey).toBase58();

        const encryptedZkAppPrivateKey = EncryptionKey.encrypt(
          Buffer.from(zkAppPrivateKey.toBase58(), "utf-8"),
          Buffer.from(config.SERVICE_SECRET, "base64")
        ).toString("base64");

        transaction = await zkAppCompiler.compileAndCreateDeployUnsignTx(
          request.payerAddress,
          zkAppPrivateKey,
          dbSettings.merkleHeight,
          dbSettings.databaseName
        );

        await secureStorage.replaceOne(
          { databaseName: dbSettings.databaseName },
          {
            privateKey: encryptedZkAppPrivateKey,
            databaseName: dbSettings.databaseName,
          },
          { upsert: true }
        );
      } else if (tx.transactionType === "rollup") {
        const privateKey = await secureStorage.findOne({
          databaseName: dbSettings.databaseName,
        });

        if (!privateKey) {
          throw new Error(
            `Private key for ${dbSettings.databaseName} not found`
          );
        }

        const decryptedPrivateKey = EncryptionKey.decrypt(
          Buffer.from(privateKey.privateKey, "base64"),
          Buffer.from(config.SERVICE_SECRET, "base64")
        ).toString();

        const zkAppPrivateKey = PrivateKey.fromBase58(decryptedPrivateKey);
        zkAppPublicKey = PublicKey.fromPrivateKey(zkAppPrivateKey).toBase58();

        const proof = await ModelProof.getInstance().getProof(
          dbSettings.databaseName
        );
        if (!proof) {
          throw new Error(`Proof for ${dbSettings.databaseName} not found`);
        }

        transaction = await zkAppCompiler.compileAndCreateRollUpUnsignTx(
          request.payerAddress,
          zkAppPrivateKey,
          dbSettings.merkleHeight,
          proof
        );
      } else {
        throw new Error(`Unsupported transaction type: ${tx.transactionType}`);
      }

      await modelTransaction.updateById(request.id, {
        status: "ready",
        tx: transaction,
      });

      logger.info(
        `Successfully compiled: Database: ${dbSettings.databaseName}, Transaction Type: ${tx.transactionType}`
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error processing queue: ${error.message}`);
      } else {
        logger.error("Unknown error occurred:", error);
      }
    }
  }
}

(async () => {
  const redisQueue = new RedisQueueService<DbTransactionQueue>(
    "zkAppDeploymentQueue",
    { url: config.REDIS_URL }
  );

  await processQueue(redisQueue);
})();
