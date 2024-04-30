import { createDatabase } from "../../../src/client/index.js";

describe('Database Model Requests', () => {
  test('should create new database and it should be included to the list', async () => {
    const DB_DAME = 'my-test-db';
    const MERKLE_HEIGHT = 12;
    const response = await createDatabase(DB_DAME, MERKLE_HEIGHT);

    expect(response.dbCreate).toBeTruthy();
  });
});
