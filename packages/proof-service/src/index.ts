import { MerkleTree } from "o1js";
import config from "./helper/config";
import { DatabaseEngine } from "./model/database/database-engine";
import { TaskQueue } from "./queue/TaskQueue";
import TaskQueueProcessor from "./queue/TaskQueueProcessor";
import { ModelTask } from "./model/ModelTask";

let DEFAULT_MERKLE_HEIGHT = 12;

async function processQueue() {
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  const modelTask = new ModelTask("global", "queue");

  const taskQueue = new TaskQueue(modelTask);

  const taskQueueProcessor = new TaskQueueProcessor(taskQueue, new MerkleTree(DEFAULT_MERKLE_HEIGHT));

  await taskQueueProcessor.processTasks();
}

processQueue();
