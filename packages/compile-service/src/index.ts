import { RedisQueueService } from "./message-queue";
import { ZkCompileService } from "./zk-compile";

(async () => {
  const zkAppCompiler = new ZkCompileService({
    networkId: "testnet",
    mina: "https://api.minascan.io/node/devnet/v1/graphql",
  });

  const redisQueue = new RedisQueueService("zkAppDeploymentQueue");

  while (true) {
    const request = await redisQueue.dequeue();
    console.log("🚀 ~ request:", request);
    if (request) {
      try {
        const response = await zkAppCompiler.compileAndCreateUnsignTx(request);
        // Send the unsigned transaction back to the user (implementation depends on your communication method)
        // Send to user or storing to db
        console.log("response", response);
      } catch (error) {
        console.error("Error processing deployment request:", error);
      }
    }
  }
})();
