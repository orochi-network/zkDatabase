import { faker } from '@faker-js/faker';
import { ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const NEW_OWNER = 'adrianna.bednar';
async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  const fakeUser = {
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
  };

  await zkdb.authenticator.signUp(fakeUser.username, fakeUser.email);

  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  console.log(`Current owner of ${DB_NAME}: ${fakeUser.username}`);
  // Check user exist
  if (await zkdb.system.userExist({ userName: NEW_OWNER })) {
    await zkdb.db(DB_NAME).changeOwner(NEW_OWNER);
    const dbInfo = await zkdb.db(DB_NAME).setting();
    if (dbInfo.databaseOwner === NEW_OWNER) {
      console.log(
        `Transfer successfully ${DB_NAME} owner now is ${dbInfo.databaseOwner}`
      );
    }
  }
  await zkdb.authenticator.signOut();
}

await run();
