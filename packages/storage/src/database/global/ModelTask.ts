import { InsertOneOptions } from 'mongodb';
import ModelBasic from '../base/basic.js';
import { zkDatabaseConstants } from '../../common/const.js';

export type TaskEntity = {
  merkleIndex: bigint;
  hash: string;
  processed?: boolean;
  createdAt?: Date;
  database: string;
  collection: string;
};

export class ModelTask extends ModelBasic<TaskEntity> {
  private static instance: ModelTask | null = null;

  private constructor() {
    super(zkDatabaseConstants.globalDatabase, zkDatabaseConstants.collections.proofQueue);
  }

  public static getInstance(): ModelTask {
    if (!ModelTask.instance) {
      ModelTask.instance = new ModelTask();
      ModelTask.instance.collection.createIndex({ merkleIndex: 1 }, { unique: true });
    }
    return ModelTask.instance;
  }

  public async createTask(
    task: TaskEntity,
    options?: InsertOneOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.insertOne(
      {
        ...task,
        createdAt: new Date(),
        processed: false,
      },
      options
    );
  }

  public async getNewTask(): Promise<TaskEntity | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { processed: false },
      { sort: { createdAt: 1 } }
    );

    const task = result as TaskEntity | null;
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
