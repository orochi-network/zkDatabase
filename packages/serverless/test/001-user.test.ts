import { DatabaseEngine } from '../src/model/abstract/database-engine';
import config from '../src/helper/config';

beforeAll(async () => {
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }
});

test('test', async () => {
  expect(1).toBe(1);
});

afterAll(async () => {
  await DatabaseEngine.getInstance().disconnect();
});
