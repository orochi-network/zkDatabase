import { ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { faker } from '@faker-js/faker';

async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  const fakeUser = {
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
  };

  await zkdb.authenticator.signUp(fakeUser.username, fakeUser.email);

  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  const dbList = await zkdb.system.listDatabase({ databaseName: DB_NAME });

  if (
    (await zkdb.db(DB_NAME).exist()) &&
    dbList.find((db) => db.databaseName === DB_NAME)
  ) {
    console.log(`${DB_NAME} created successfully`);
  }

  await zkdb.authenticator.signOut();
}

await run();
