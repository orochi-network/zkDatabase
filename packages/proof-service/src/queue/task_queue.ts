import { ModelTask } from '@zkdb/storage';
import { ITaskQueue, Task } from './i-task-queue.js';
import { Field } from 'o1js';

export class TaskQueue implements ITaskQueue {
  constructor(private modelTask: ModelTask) {}

  async getNextTask(): Promise<Task | null> {
    const entity = await this.modelTask.getNewTask();
    if (!entity) {
      return null;
    }
    return { ...entity, hash: Field(entity.hash) };
  }

  async markTaskProcessed(task: Task): Promise<void> {
    await this.modelTask.markTaskProcessed(task.merkleIndex);
  }
}
