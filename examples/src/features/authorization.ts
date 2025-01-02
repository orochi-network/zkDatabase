import { ZKDatabase } from 'zkdb';
import { ZKDB_URL } from '../utils/config.js';

async function run() {
  const zkdb = await ZKDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  console.log('Authorization getUser: ', zkdb.authenticator.getUser());

  await zkdb.authenticator.signOut();
}

await run();
