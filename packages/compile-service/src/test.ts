import { PrivateKey, PublicKey } from "o1js";
import { RedisQueueService } from "./message-queue";
export type TDeploymentRequest = {
  payerAddress: string;
  merkleHeight: number;
};
(async () => {
  const redisQueue = new RedisQueueService("zkAppDeploymentQueue");
  const data = {
    payerAddress: PublicKey.fromBase58(
      "B62qmYPgVboW3JhtmzCKDtgL9EPEz7rfwbTwdbLZCU8x8fGeH2X6JUL"
    ),
    merkleHeight: 9,
  };
  await redisQueue.enqueue(JSON.stringify(data));
})();
