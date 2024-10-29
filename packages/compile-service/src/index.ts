import { logger } from "@helper";
import { ZkCompileService } from "@service";
import { DatabaseEngine, ModelDbDeployTx } from "@zkdb/storage";
import { config } from "./helper/config";
import { RedisQueueService } from "./message-queue";
export type DbDeployQueue = {
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
        const response = await zkAppCompiler.compileAndCreateUnsignTx(request);
        await ModelDbDeployTx.getInstance().create({
          merkleHeight: response.merkleHeight,
          appPublicKey: response.zkAppAddress,
          tx: response.tx,
          databaseName: request.databaseName,
        });
        logger.info(`Compile successfully: ${response.zkAppAddress}`);
      } catch (error) {
        logger.error("Error processing deployment request: ", error);
      }
    }
  }
})();
