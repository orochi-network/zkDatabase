import { extend } from 'joi';
import { Schema, ZkDatabase } from './index';
import { CircuitString, UInt64 } from 'o1js';

const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  url: 'http://zkdb-serverless.zenfactory.org/graphql',
});

if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@example.com');
}

console.log(await zkdb.auth.signIn());

console.log(await zkdb.db('zkdb_test').info());

/*
class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const shirt = new TShirt({
  name: CircuitString.fromString('Orochi'),
  price: UInt64.from(12),
});

const encodedShirt = shirt.serialize();
console.log(encodedShirt);*/

await zkdb.auth.signOut();
