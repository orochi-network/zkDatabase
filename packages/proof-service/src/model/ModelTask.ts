import { ModelBasic } from 'storage';

export type TaskEntity = {
  id: bigint;
  index: bigint;
  hash: string;
  processed?: boolean;
};

export class ModelTask extends ModelBasic {
  public async createTask(task: TaskEntity): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.insertOne({
      ...task,
      processed: false,
    });
  }

  public async getNewTask(): Promise<TaskEntity | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const task = await this.collection.findOneAndUpdate(
      { processed: false },
      { $set: { processed: true } },
      { sort: { createdAt: 1 }, returnDocument: 'after' }
    );

    return task as any;
  }

  public async markTaskProcessed(taskId: bigint): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.updateOne(
      { id: taskId },
      { $set: { processed: true } }
    );
  }
}
