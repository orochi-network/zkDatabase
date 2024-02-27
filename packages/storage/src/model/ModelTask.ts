import ModelBasic from './abstract/basic.js';

export type TaskEntity = {
  id: bigint;
  index: bigint;
  hash: string;
  processed?: boolean;
  createdAt?: Date,
  database: string;
  collection: string;
};

export class ModelTask extends ModelBasic {
  private static instance: ModelTask | null = null;

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, collectionName);
  }

  public static getInstance(
    databaseName: string,
    collectionName: string
  ): ModelTask {
    if (!ModelTask.instance) {
      ModelTask.instance = new ModelTask(databaseName, collectionName);
      ModelTask.instance.collection.createIndex({ id: 1 }, { unique: true });
    }
    return ModelTask.instance;
  }

  public async createTask(task: TaskEntity): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.insertOne({
      ...task,
      createdAt: new Date(),
      processed: false,
    });
  }

  public async getNewTask(): Promise<TaskEntity | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { processed: false },
      { sort: { createdAt: 1 } }
    );

    const task = result?.value as TaskEntity | null;
    return task;
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
