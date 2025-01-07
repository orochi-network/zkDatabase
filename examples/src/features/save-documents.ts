import { CircuitString, UInt64 } from 'o1js';
import { ZkDatabase } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { EProofStatusDocument, Schema } from '@zkdb/common';
import { Permission } from '@zkdb/permission';

const COLLECTION_NAME = 'my-test-document-collection';
const GROUP_NAME = 'my-test-document-group';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const zkdb = await ZkDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  await zkdb
    .db(DB_NAME)
    .group(GROUP_NAME)
    .create({ groupDescription: 'My group description' });

  const collection = zkdb
    .db(DB_NAME)
    .collection<typeof TShirt>(COLLECTION_NAME);

  await collection.create(TShirt, Permission.policyPrivate(), GROUP_NAME);

  await collection.insert({
    name: 'zkDatabase',
    price: 15n,
  });

  const document = await collection.findOne({ name: 'zkDatabase' });

  // Polling each 5000ms to check proof status
  const checkStatus = async () => {
    // Need to be signIn because closure is another scope
    await zkdb.authenticator.signIn();

    const status = await document?.proofStatus();
    console.log('Proof status:', status);

    if (status === EProofStatusDocument.Proved) {
      console.log('Proof completed!');
      clearInterval(intervalId);
    }
  };

  const intervalId = setInterval(checkStatus, 5000);

  await zkdb.authenticator.signOut();
}

await run();
