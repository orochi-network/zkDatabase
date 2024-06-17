import { Router, Request, Response } from 'express';
import { ProofService } from '../service/proof-service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const service = ProofService.getInstance();
    const status = service.status();
    if (status && status === 'processing') {
      return res
        .status(409)
        .json({ message: 'A proof creation job is already running' });
    }
    const proofId = await service.createProof(req.body.id);
    res.status(201).json({ message: 'Proof creation started', proofId });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: 'Error creating proof', error: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error' });
    }
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const service = ProofService.getInstance();
    const status = await service.status();
    res.status(200).json({ status });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: 'Error fetching status', error: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error' });
    }
  }
});

export default router;
