import { logger } from "@helper";
import { EncryptionKey } from "@orochi-network/vault";
import { UnsignedTransaction, ZkCompileService } from "@service";
import { ETransactionStatus, ETransactionType } from "@zkdb/common";
import {
  DatabaseEngine,
  ModelMetadataDatabase,
  ModelProof,
  ModelSecureStorage,
  ModelTransaction,
} from "@zkdb/storage";
import { PrivateKey, PublicKey } from "o1js";
import { setTimeout } from "timers/promises";
import { config } from "./helper/config";
import { RedisQueueService } from "./message-queue";

const TIMEOUT = 1000;

export type TransactionType = "deploy" | "rollup";

export type DbTransactionQueue = {
  id: string;
  payerAddress: string;
};

async function findTransactionWithRetry(
  modelTransaction: ModelTransaction,
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
  // Init zkAppCompiler
  const zkAppCompiler = new ZkCompileService({
    networkId: config.NETWORK_ID,
    mina: config.MINA_URL,
  });

  // Connect to db
  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  const modelTransaction = ModelTransaction.getInstance();
  const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();

  while (true) {
    const request = await redisQueue.dequeue();
    if (request) {
      const tx = await findTransactionWithRetry(modelTransaction, request.id);

      if (!request) {
        await setTimeout(TIMEOUT); // Prevent busy looping when the queue is empty
        continue;
      }

      if (!tx) {
        logger.error(`Transaction ${request.id} has not been found`);
        continue;
      }

      const database = await modelDatabaseMetadata.findOne({
        databaseName: tx.databaseName,
      });

      // Make sure database must be existed first
      if (!database) {
        logger.error(`database for ${tx.databaseName} has not been found`);
        continue;
      }

      logger.info(`Received ${tx.databaseName} to queue`);

      try {
        const secureStorage = ModelSecureStorage.getInstance();
        const { databaseName, merkleHeight } = database;
        let transactionRaw: UnsignedTransaction;
        let zkAppPublicKey: string;
        if (tx.transactionType === ETransactionType.Deploy) {
          const zkAppPrivateKey = PrivateKey.random();

          zkAppPublicKey = PublicKey.fromPrivateKey(zkAppPrivateKey).toBase58();

          const encryptedZkAppPrivateKey = EncryptionKey.encrypt(
            Buffer.from(zkAppPrivateKey.toBase58(), "utf-8"),
            Buffer.from(config.SERVICE_SECRET, "base64")
          ).toString("base64");

          transactionRaw = await zkAppCompiler.compileAndCreateDeployUnsignTx(
            request.payerAddress,
            zkAppPrivateKey,
            database.merkleHeight,
            database.databaseName
          );
          await secureStorage.replaceOne(
            {
              databaseName,
            },
            {
              privateKey: encryptedZkAppPrivateKey,
              databaseName,
            },
            { upsert: true }
          );
        } else if (tx.transactionType === ETransactionType.Rollup) {
          const privateKey = await secureStorage.findOne({
            databaseName,
          });

          if (!privateKey) {
            throw Error("Private key has not been found");
          }
          // storing encryptedData:
          const decryptedPrivateKey = EncryptionKey.decrypt(
            Buffer.from(privateKey.privateKey, "base64"),
            Buffer.from(config.SERVICE_SECRET, "base64")
          ).toString();

          const zkAppPrivateKey = PrivateKey.fromBase58(decryptedPrivateKey);

          zkAppPublicKey = PublicKey.fromPrivateKey(zkAppPrivateKey).toBase58();

          const proof = await ModelProof.getInstance().getProof(databaseName);

          if (!proof) {
            throw new Error(`Proof for ${databaseName} not found`);
          }

          transactionRaw = await zkAppCompiler.compileAndCreateRollUpUnsignTx(
            request.payerAddress,
            zkAppPrivateKey,
            merkleHeight,
            proof
          );
        } else {
          throw new Error(
            `Unsupported transaction type: ${tx.transactionType}`
          );
        }

        await modelTransaction.updateById(tx._id, {
          status: ETransactionStatus.Unsigned,
          transactionRaw,
        });

        logger.info(
          `Successfully compiled: Database: ${databaseName}, Transaction Type: ${tx.transactionType}`
        );
      } catch (error) {
        let errorMessage: string;

        if (error instanceof Error) {
          errorMessage = `Error processing queue: ${error.message}`;
        } else {
          errorMessage = `Unknown error occurred: ${error}`;
        }

        logger.error(errorMessage);

        await modelTransaction.updateById(tx._id, {
          status: ETransactionStatus.Failed,
          error: (error as Error).message,
        });
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
