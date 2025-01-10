import { CircuitString, UInt64 } from 'o1js';
import { Schema, ZkDatabase } from './index';

const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  url: 'http://zkdb-serverless.zenfactory.org/graphql',
});

console.log(await zkdb.auth.signIn());

class Shirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

type TShirt = typeof Shirt;

const collection = await zkdb
  .db('zkdb_test')
  .collection<TShirt>('test_collection');

const doc = await collection.findOne({ name: 'Test Shirt' });

if (doc) {
  console.log(doc.document);
}

const listDoc = await collection.findMany(undefined, { limit: 10, offset: 0 });

listDoc.data.forEach((item) => {
  console.log(item.document);
});

await zkdb.db('zkdb_test').group('test').userAdd(['user1', 'user2']);

await zkdb.auth.signOut();
