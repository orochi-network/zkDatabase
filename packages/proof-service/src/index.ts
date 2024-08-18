import { DatabaseEngine } from '@zkdb/storage';
import TaskService from './service/task-service.js';
import logger from './helper/logger.js';
import { config } from './helper/config.js';
import { Mina } from 'o1js';

(async () => {
  const DEV_NET = Mina.Network({
    mina: 'https://api.minascan.io/node/devnet/v1/graphql',
  });

  Mina.setActiveInstance(DEV_NET);
  const dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  const taskService = new TaskService();

  await taskService.fetchAndProcessTasks();

  logger.info('Proof service stopped.');
})();
