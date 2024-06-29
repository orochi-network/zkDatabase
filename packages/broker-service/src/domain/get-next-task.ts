import { ModelQueueTask } from "@zkdb/storage";

export async function getNextTaskId(): Promise<string | null> {
  const task =
    await ModelQueueTask.getInstance().getLatestQueuedTaskByDatabase();

  if (task) {
    return task._id.toString();
  }
  return null;
}
