import { ModelQueueTask } from "@zkdb/storage";

export async function getNextTaskId(): Promise<string | undefined> {
  const task = await ModelQueueTask.getInstance().getLatestQueuedTaskByDatabase();

  return task?._id?.toString();
}
