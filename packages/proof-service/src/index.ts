import { TaskQueue } from "./queue/TaskQueue";
import TaskQueueProcessor from "./queue/TaskQueueProcessor";

async function processQueue() {
  const taskQueue = new TaskQueue();
  await taskQueue.connect();

  const taskQueueProcessor = new TaskQueueProcessor(taskQueue);

  await taskQueueProcessor.processTasks();
}

processQueue();
