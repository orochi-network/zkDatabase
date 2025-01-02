import { CircuitString, UInt64 } from 'o1js';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { ZKDatabase } from 'zkdb';
import { EIndexType, Schema } from '@zkdb/common';
import { Permission } from '@zkdb/permission';

const COLLECTION_NAME = 'my-collection';
const GROUP_NAME = 'my-group';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const zkdb = await ZKDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signUp('exampleuser', 'user@example.com');
  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  await zkdb.db(DB_NAME).group(GROUP_NAME).create();

  const collection = zkdb.db(DB_NAME).collection(COLLECTION_NAME);

  await collection.create(
    TShirt,
    Permission.from({
      owner: {
        read: true,
        write: true,
        delete: true,
        system: true,
      },
      group: {
        read: true,
      },
    }),
    GROUP_NAME
  );

  // This creates a composite index over the fields `name` and `price` and a
  // single index over the field `price`
  await collection.index.create([
    {
      index: {
        name: EIndexType.Asc,
        price: EIndexType.Asc,
      },
      unique: false,
    },
    {
      index: {
        price: EIndexType.Desc,
      },
      unique: false,
    },
  ]);

  const indexes = await collection.index.list();
  console.log('Index: ', indexes);

  const [firstIndex] = Object.keys(indexes[0]);

  await zkdb.db(DB_NAME).collection(COLLECTION_NAME).index.drop(firstIndex);

  console.log(
    'List indexes after drop one: ',
    await zkdb.db(DB_NAME).collection(COLLECTION_NAME).index.list()
  );

  await zkdb.authenticator.signOut();
}

await run();
