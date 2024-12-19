import { DatabaseEngine } from '@zkdb/storage';
import { TaskService } from '@service';
import { logger, config } from '@helper';
import { Mina } from 'o1js';

(async () => {
  const network = Mina.Network({
    networkId: config.NETWORK_ID,
    mina: config.MINA_URL,
  });

  Mina.setActiveInstance(network);

  // db service
  const serviceDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  // db proof
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);
  if (!serviceDb.isConnected()) {
    await serviceDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  const taskService = new TaskService();

  await taskService.fetchAndProcessTasks();

  logger.info('Proof service stopped.');
})();
