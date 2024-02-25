import { ModelTask } from 'storage';
import { ITaskQueue, Task } from './ITaskQueue.js';
import { Field } from 'o1js';

export class TaskQueue implements ITaskQueue {

  constructor(private modelTask: ModelTask) {
  }

  async getNextTask(): Promise<Task | null> {
    const entity = await this.modelTask.getNewTask()
    if (!entity) {
      return null;
    }
    return {
      id: entity.id,
      index: entity.index,
      hash: Field(entity.hash),
      database: "",
      collection: ""
    }
  }

  async markTaskProcessed(task: Task): Promise<void> {
    await this.modelTask.markTaskProcessed(task.id);
  }
}
