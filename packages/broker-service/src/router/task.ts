import { Router, Request, Response } from "express";
import { getNextTaskId } from "../domain/get-next-task";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const nextTaskId = await getNextTaskId();

    return res.status(200).json({ id: nextTaskId });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: "Error retrieving task", error: error.message });
    } else {
      res.status(500).json({ message: "Unknown error" });
    }
  }
});

export default router;
