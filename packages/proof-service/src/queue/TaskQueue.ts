import { MongoClient, Collection } from 'mongodb';
import {
  DATABASE_URL,
  GLOBAL_DATABASE_NAME,
  GLOBAL_QUEUE_COLLECTION_NAME,
} from '../database/const';
import { ITaskQueue, Task } from './ITaskQueue';

export class TaskQueue implements ITaskQueue {
  private client: MongoClient | null = null;
  private collection: Collection<Task> | null = null;

  async connect(): Promise<void> {
    this.client = new MongoClient(DATABASE_URL);
    await this.client.connect();
    const db = this.client.db(GLOBAL_DATABASE_NAME);
    this.collection = db.collection<Task>(GLOBAL_QUEUE_COLLECTION_NAME);
  }

  isConnected(): boolean {
    return this.client !== null && this.collection !== null;
  }

  async getNextTask(): Promise<Task | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const task = await this.collection.findOneAndUpdate(
      { processed: false },
      { $set: { processed: true } },
      { sort: { createdAt: 1 }, returnDocument: 'after' }
    );

    return task;
  }

  async markTaskProcessed(task: Task): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.updateOne(
      { id: task.id },
      { $set: { processed: true } }
    );
  }
}
