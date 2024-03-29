import { Field } from "o1js";

export type Task = {
  merkleIndex: bigint;
  hash: Field;
  database: string,
  collection: string,
  createdAt: Date
};

export interface ITaskQueue {
  getNextTask(): Promise<Task | null>;
  markTaskProcessed(task: Task): Promise<void>;
}
