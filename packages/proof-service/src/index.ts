import express from 'express';
import proofRouter from './router/proof.js';

(async () => {
  const app = express();

  app.use(express.json());
  
  app.use("/proof", proofRouter);
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();