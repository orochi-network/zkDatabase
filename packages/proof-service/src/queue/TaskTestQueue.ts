import { ITaskQueue, Task } from './ITaskQueue';

export class TaskTestQueue implements ITaskQueue {
  private tasks: Task[];
  private currentIndex = 0;

  constructor(numTasks: number) {
    this.tasks = Array.from({ length: numTasks }, (_, i) => ({
      id: BigInt(i + 1),
      index: BigInt(i + 1),
      hash: `${i + 1}`,
    }));
  }

  connect(): Promise<void> {
    return Promise.resolve();
  }

  isConnected(): boolean {
    return true;
  }

  async getNextTask(): Promise<Task | null> {
    return this.currentIndex < this.tasks.length ? this.tasks[this.currentIndex++] : null;
  }

  markTaskProcessed(task: Task): Promise<void> {
    console.log(`Task processed: ${task.id}`);
    return Promise.resolve();
  }
}
