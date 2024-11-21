import TaskService from './service/task-service.js';
import logger from './helper/logger.js';
import { config } from './helper/config.js';
import { Mina } from 'o1js';
import { initModelLoader } from './helper/model-loader.js';

(async () => {
  await initModelLoader();

  const network = Mina.Network({
    networkId: config.NETWORK_ID,
    mina: config.MINA_URL,
  });

  Mina.setActiveInstance(network);

  const taskService = new TaskService();
  await taskService.fetchAndProcessTasks();

  logger.info('Proof service stopped.');
})();
