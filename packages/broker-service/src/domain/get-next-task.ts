import { ModelQueueTask, TransactionManager } from "@zkdb/storage";
import { proofDb } from "../helper/config.js";

export async function getNextTaskId(): Promise<string | null> {
  TransactionManager.addSession({
    name: "proof",
    session: proofDb.client.startSession(),
  });
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
