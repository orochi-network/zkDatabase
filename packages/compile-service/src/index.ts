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
import { PrivateKey, PublicKey } from "o1js";
import { config } from "./helper/config";
import { RedisQueueService } from "./message-queue";

export type TransactionType = "deploy" | "rollup";

export type DbTransactionQueue = {
  id: string;
  payerAddress: string;
};

(async () => {
  // Init zkAppCompiler
  const zkAppCompiler = new ZkCompileService({
    networkId: config.NETWORK_ID,
    mina: config.MINA_URL,
  });
  // Init redis queue service
  const redisQueue = new RedisQueueService<DbTransactionQueue>(
    "zkAppDeploymentQueue",
    { url: config.REDIS_URL }
  );
  // Connect to db
  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  const modelTransaction = ModelDbTransaction.getInstance();
  const modelDbSettings = ModelDbSetting.getInstance();

  while (true) {
    const request = await redisQueue.dequeue();
    if (request) {
      const tx = await modelTransaction.findById(request.id);

      if (!tx) {
        logger.error(`Transaction ${request.id} has not been found`);
        continue;
      }

      const dbSettings = await modelDbSettings.getSetting(tx.databaseName);

      // Impossible case
      if (!dbSettings) {
        logger.error(`Settings for ${tx.databaseName} has not been found`);
        continue;
      }

      logger.info(`Received ${tx.databaseName} to queue`);

      try {
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
            {
              databaseName: dbSettings.databaseName,
            },
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
            throw Error("Private key has not been found");
          }
          // storing encryptedData:
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
            throw Error("Proof has not been found");
          }
          transaction = await zkAppCompiler.compileAndCreateRollUpUnsignTx(
            request.payerAddress,
            zkAppPrivateKey,
            dbSettings.merkleHeight,
            proof
          );
        } else {
          throw Error(
            `Transaction type ${tx.transactionType} is not supported`
          );
        }

        const deployTx = await ModelDbTransaction.getInstance().updateById(
          request.id,
          {
            status: "ready",
            tx: transaction,
          }
        );

        if (!deployTx) {
          throw new Error(
            `Error cannot add ${dbSettings.databaseName} to database`
          );
        }

        logger.info(
          `Compile successfully: Database: ${dbSettings.databaseName}, transaction type: ${tx.transactionType}`
        );
      } catch (error) {
        // TODO: Error message ???
        await modelTransaction.updateById(request.id, {
          status: "failed",
          error: (error as Error).message,
        });
        logger.error("Error processing deployment request: ", error);
      }
    }
  }
})();
