import { logger } from "@helper";
import { ZkCompileService, UnsignedTransaction } from "@service";
import { DatabaseEngine, ModelDbDeployTx, ModelProof } from "@zkdb/storage";
import { config } from "./helper/config";
import { RedisQueueService } from "./message-queue";
import { PrivateKey } from "o1js";

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
  const dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);

  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  while (true) {
    const request = await redisQueue.dequeue();
    if (request) {
      logger.info(`Received ${request.databaseName} to queue`);
      try {
        let transaction: UnsignedTransaction;

        if (request.transactionType === "deploy") {
          const zkAppPrivateKey = PrivateKey.random();

          transaction = await zkAppCompiler.compileAndCreateDeployUnsignTx(
            request.payerAddress,
            zkAppPrivateKey,
            request.merkleHeight
          );
        } else {
          const proof = await ModelProof.getInstance().getProof(
            request.databaseName
          );

          const zkAppPrivateKey = PrivateKey.random();

          if (proof) {
            transaction = await zkAppCompiler.compileAndCreateRollUpUnsignTx(
              request.payerAddress,
              zkAppPrivateKey,
              request.merkleHeight,
              proof
            );
          } else {
            throw Error();
          }
        }

        await ModelDbDeployTx.getInstance().create({
          transactionType: request.transactionType,
          tx: JSON.stringify(transaction),
          databaseName: request.databaseName,
        });
        logger.info(`Compile successfully: Database: ${request.databaseName}, transaction type: ${request.transactionType}`);
      } catch (error) {
        logger.error("Error processing deployment request: ", error);
      }
    }
  }
})();
