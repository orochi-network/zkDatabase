import config from "./helper/config";
import { DatabaseEngine, ModelQueueTask } from "@zkdb/storage";
import QueueService from "./queue/queue-service";
import logger from "./helper/logger"; // Assume you have a logger module

async function processQueue() {
  try {
    const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
    if (!dbEngine.isConnected()) {
      await dbEngine.connect();
    }

    const queue = ModelQueueTask.getInstance();
    const taskQueueProcessor = new QueueService(queue);

    await taskQueueProcessor.start();
  } catch (error) {
    logger.error("An error occurred while processing the queue:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, gracefully shutting down...");
  await DatabaseEngine.getInstance().disconnect();
  process.exit(0); // Exit gracefully
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, gracefully shutting down...");
  await DatabaseEngine.getInstance().disconnect();
  process.exit(0); // Exit gracefully
});

processQueue();
