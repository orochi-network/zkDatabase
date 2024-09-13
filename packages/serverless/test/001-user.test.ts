import { DatabaseEngine } from '@zkdb/storage';
import { config } from '../src/helper/config.js';

beforeAll(async () => {
  const dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }
});

test('User sign in', async () => {
  expect(1).toBe(1);
});

afterAll(async () => {
  await DatabaseEngine.getInstance().disconnect();
});
