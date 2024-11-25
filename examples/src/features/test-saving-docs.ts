import { CircuitString, UInt64 } from 'o1js';
import { Schema, ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const COLLECTION_NAME = 'my-test-document-collection';

async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  await zkdb.authenticator.signIn();

  const collection = await zkdb.database(DB_NAME).from(COLLECTION_NAME);

  for (let i = 0; i < 10; i++) {
    await collection.insert(
      new TShirt({
        name: CircuitString.fromString(`Guchi ${i}`),
        price: UInt64.from(i),
      })
    );
  }

  await zkdb.authenticator.signOut();
}

await run();
