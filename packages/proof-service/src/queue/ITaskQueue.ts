export type Task = {
  id: bigint;
  index: bigint;
  hash: string;
};

export interface ITaskQueue {
  connect(): Promise<void>;
  isConnected(): boolean;
  getNextTask(): Promise<Task | null>;
  markTaskProcessed(task: Task): Promise<void>;
}
