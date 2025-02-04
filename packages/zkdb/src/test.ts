import { CircuitString, UInt64 } from 'o1js';
import { Schema, ZkDatabase } from './index';

/*
const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  url: 'http://zkdb-serverless.zenfactory.org/graphql',
}); */

const zkdb = await ZkDatabase.connect(
  'zkdb+http://chiro-user:EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP@localhost:4000/graphql'
);

if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@orochi.network');
}

const DB_NAME = 'zkdb_test1';

console.log(await zkdb.auth.signIn());

if (!(await zkdb.db(DB_NAME).exist())) {
  await zkdb.db(DB_NAME).create({ merkleHeight: 8 });
}

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

await zkdb.db(DB_NAME).collection('students').create(TShirt);

const collection = zkdb.db(DB_NAME).collection<typeof TShirt>('students');

for (let i = 0; i < 10; i += 1) {
  const res = await collection.insert({ name: `zkDatabase ${i}`, price: 15n });
  console.log(res);
}

console.log(await zkdb.db(DB_NAME).rollUpOffChainHistory());

console.log(await zkdb.db(DB_NAME).info());

await zkdb.auth.signOut();
