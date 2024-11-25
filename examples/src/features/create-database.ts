import assert from 'assert';
import { ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  await zkdb.authenticator.signIn();

  await zkdb.fromGlobal().createDatabase(DB_NAME, 18);

  const databases = await zkdb
    .fromGlobal()
    .databases({ databaseName: DB_NAME });

  assert(
    databases[0].databaseName === DB_NAME,
    `${DB_NAME} created successfully`
  );

  await zkdb.authenticator.signOut();
}

await run();
