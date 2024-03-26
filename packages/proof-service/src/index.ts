import config from "./helper/config";
import { DatabaseEngine, ModelTask } from "@zkdb/storage";
import { TaskQueue } from "./queue/task_queue";
import TaskQueueProcessor from "./queue/processor";
import logger from "./helper/logger"; // Assume you have a logger module

async function processQueue() {
  try {
    const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
    if (!dbEngine.isConnected()) {
      await dbEngine.connect();
    }

    const modelTask = ModelTask.getInstance();
    const taskQueue = new TaskQueue(modelTask);
    const taskQueueProcessor = new TaskQueueProcessor(taskQueue);

    await taskQueueProcessor.processTasks();
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
