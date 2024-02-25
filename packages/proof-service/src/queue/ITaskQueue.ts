import { Field } from "o1js";

export type Task = {
  id: bigint;
  index: bigint;
  hash: Field;
  database: string,
  collection: string
};

export interface ITaskQueue {
  getNextTask(): Promise<Task | null>;
  markTaskProcessed(task: Task): Promise<void>;
}
