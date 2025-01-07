import { CircuitString, UInt64 } from 'o1js';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { ZkDatabase } from 'zkdb';
import { Schema } from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import { assert } from 'console';

const COLLECTION_NAME = 'my-permission-collection';
const GROUP_NAME = 'my-test-group-name';
class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const zkdb = await ZkDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  await zkdb.db(DB_NAME).group(GROUP_NAME).create();

  const collection = zkdb.db(DB_NAME).collection(COLLECTION_NAME);

  await collection.create(TShirt, Permission.policyPrivate(), GROUP_NAME);
  assert(
    (await collection.metadata.permissionGet())!.permission ===
      Permission.policyPrivate().value
  );

  await collection.metadata.permissionSet(Permission.policyStrict());
  assert(
    (await collection.metadata.permissionGet())!.permission ===
      Permission.policyStrict().value
  );

  await zkdb.authenticator.signOut();
}

await run();
