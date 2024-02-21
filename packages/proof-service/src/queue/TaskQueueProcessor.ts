import { ITaskQueue } from './TaskQueue';

export default class TaskQueueProcessor {
  constructor(private taskQueue: ITaskQueue) {}

  async processTasks(): Promise<void> {
    while (this.taskQueue.isConnected()) {
      const task = await this.taskQueue.getNextTask();
      if (task) {
        console.log(`Processing task: ${task.index}, ${task.hash}`);
        await this.taskQueue.markTaskProcessed(task);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
