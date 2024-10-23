import { DatabaseEngine, ModelDbDeployTx } from "@zkdb/storage";
import { RedisQueueService } from "./message-queue";
import { ZkCompileService } from "@service";
import { logger } from "@helper";
export type DbDeployQueue = {
  payerAddress: string;
  merkleHeight: number;
  databaseName: string;
};

(async () => {
  // Init zkAppCompiler
  const zkAppCompiler = new ZkCompileService({
    networkId: "testnet",
    mina: "https://api.minascan.io/node/devnet/v1/graphql",
  });
  // Init redis queue service
  const redisQueue = new RedisQueueService<DbDeployQueue>(
    "zkAppDeploymentQueue"
  );
  // Connect to db
  const dbEngine = DatabaseEngine.getInstance(
    "mongodb://localhost:27017/zk?directConnection=true"
  );

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
