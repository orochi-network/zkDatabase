import { faker } from '@faker-js/faker';
import { ZkDatabaseClient } from 'zkdb';
import { ZKDB_URL } from '../utils/config.js';

async function run() {
  const zkdb = await ZkDatabaseClient.connect(ZKDB_URL);

  const fakeUser = {
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
  };

  await zkdb.authenticator.signUp(fakeUser.username, fakeUser.email);

  await zkdb.authenticator.signIn();

  console.log('Authorization getUser: ', zkdb.authenticator.getUser());

  await zkdb.authenticator.signOut();
}

await run();
