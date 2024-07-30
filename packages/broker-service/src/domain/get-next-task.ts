import { ModelQueueTask, withTransaction } from "@zkdb/storage";

export async function getNextTaskId(): Promise<string | null> {
  return withTransaction(async (session) => {
    const modelQueueTask = ModelQueueTask.getInstance();
    const task = await modelQueueTask.getLatestQueuedTaskByDatabase(session);

    if (task) {
      await modelQueueTask.markTaskAsExecuting(task.merkleIndex, { session });
      return task._id.toString();
    }

    return null;
  });
}
