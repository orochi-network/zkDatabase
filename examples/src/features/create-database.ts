import { ZkDatabase } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

async function run() {
  const zkdb = await ZkDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  if (await zkdb.db(DB_NAME).exist()) {
    console.log(`${DB_NAME} created successfully`);
  }

  await zkdb.authenticator.signOut();
}

await run();
