import { logger } from "@helper";
import { EncryptionKey } from "@orochi-network/vault";
import { UnsignedTransaction, ZkCompileService } from "@service";
import {
  DatabaseEngine,
  ModelDbDeployTx,
  ModelProof,
  ModelSecureStorage,
} from "@zkdb/storage";
import { PrivateKey, PublicKey } from "o1js";
import { config } from "./helper/config";
import { RedisQueueService } from "./message-queue";

export type TransactionType = "deploy" | "rollup";

export type DbDeployQueue = {
  transactionType: TransactionType;
  payerAddress: string;
  merkleHeight: number;
  databaseName: string;
};

(async () => {
  // Init zkAppCompiler
  const zkAppCompiler = new ZkCompileService({
    networkId: config.NETWORK_ID,
    mina: config.MINA_URL,
  });
  // Init redis queue service
  const redisQueue = new RedisQueueService<DbDeployQueue>(
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

  while (true) {
    const request = await redisQueue.dequeue();
    if (request) {
      logger.info(`Received ${request.databaseName} to queue`);

      try {
        const secureStorage = ModelSecureStorage.getInstance();

        let transaction: UnsignedTransaction;
        let zkAppPublicKey: string;
        if (request.transactionType === "deploy") {
          const zkAppPrivateKey = PrivateKey.random();
          zkAppPublicKey = PublicKey.fromPrivateKey(zkAppPrivateKey).toBase58();
          const encryptedZkAppPrivateKey = EncryptionKey.encrypt(
            Buffer.from(zkAppPrivateKey.toBase58(), "utf-8"),
            Buffer.from(config.SERVICE_SECRET, "base64")
          ).toString("base64");
          transaction = await zkAppCompiler.compileAndCreateDeployUnsignTx(
            request.payerAddress,
            zkAppPrivateKey,
            request.merkleHeight,
            request.databaseName
          );
          await secureStorage.insertOne({
            privateKey: encryptedZkAppPrivateKey,
            databaseName: request.databaseName,
          });
        } else if (request.transactionType === "rollup") {
          const privateKey = await secureStorage.findOne({
            databaseName: request.databaseName,
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
            request.databaseName
          );

          if (!proof) {
            throw Error("Proof has not been found");
          }
          transaction = await zkAppCompiler.compileAndCreateRollUpUnsignTx(
            request.payerAddress,
            zkAppPrivateKey,
            request.merkleHeight,
            proof
          );
        } else {
          throw Error(
            `Transaction type ${request.transactionType} is not supported`
          );
        }

        const deployTx = await ModelDbDeployTx.getInstance().create({
          transactionType: request.transactionType,
          tx: transaction,
          databaseName: request.databaseName,
        });

        if (!deployTx) {
          throw new Error(
            `Error cannot add ${request.databaseName} to database`
          );
        }

        logger.info(
          `Compile successfully: Database: ${request.databaseName}, transaction type: ${request.transactionType}`
        );
      } catch (error) {
        logger.error("Error processing deployment request: ", error);
      }
    }
  }
})();
