import { CircuitString, UInt64 } from 'o1js';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { Schema } from '@zkdb/common';
import { ZKDatabase } from 'zkdb';
import { Permission } from '@zkdb/permission';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const COLLECTION_NAME = 'my-test-document-collection';
const GROUP_NAME = 'my-test-document-group';

async function run() {
  const zkdb = await ZKDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  await zkdb.db(DB_NAME).group(GROUP_NAME).create();

  await zkdb
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .create(TShirt, Permission.policyPrivate(), GROUP_NAME);

  const collection = zkdb
    .db(DB_NAME)
    .collection<typeof TShirt>(COLLECTION_NAME);

  for (let i = 0; i < 10; i++) {
    await collection.insert({
      name: `zkDatabase Merch ${i}`,
      price: BigInt(15 + i),
    });
  }

  await zkdb.authenticator.signOut();
}

await run();
