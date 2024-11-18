import { TransactionManager, ModelQueueTask } from "@zkdb/storage";

export async function getNextTaskId(): Promise<string | null> {
  return TransactionManager.withSingleTransaction("proof", async (session) => {
    const modelQueueTask = ModelQueueTask.getInstance();
    const task = await modelQueueTask.getLatestQueuedTaskByDatabase(session);

    if (task) {
      await modelQueueTask.markTaskAsExecuting(task._id, { session });
      return task._id.toString();
    }

    return null;
  });
}
