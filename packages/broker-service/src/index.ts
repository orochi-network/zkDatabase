import express from 'express';
import taskRouter from './router/task.js';
import { DatabaseEngine } from '@zkdb/storage';
import config from './helper/config.js';

(async () => {
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }
  
  const app = express();

  app.use(express.json());
  
  app.use("/task", taskRouter);
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();