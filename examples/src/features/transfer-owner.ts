import { ZKDatabase } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { Schema } from '@zkdb/common';
import { CircuitString, UInt64 } from 'o1js';
import { Permission } from '@zkdb/permission';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const NEW_OWNER = 'adrianna.bednar';
async function run() {
  const zkdb = await ZKDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  zkdb
    .db(DB_NAME)
    .collection('my-test-document-collection')
    .metadata.ownerSet(NEW_OWNER);

  const collection = zkdb
    .db(DB_NAME)
    .collection<typeof TShirt>('my-test-document-collection');

  await collection.create(
    TShirt,
    Permission.policyPrivate(),
    'my-test-document-group'
  );

  await collection.insert({
    name: 'zkDatabase merch',
    price: 100n,
  });

  const doc = (await collection.findOne({ name: 'zkDatabase merch' }))!;

  await doc.metadata.ownerSet(NEW_OWNER);

  await zkdb.authenticator.signOut();
}

await run();
