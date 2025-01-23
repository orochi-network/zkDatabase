import { Schema } from '@zkdb/common';
import { CircuitString, UInt32 } from 'o1js';
import { ZkDatabase } from 'zkdb';

class Book extends Schema.create({
  name: CircuitString,
  author: CircuitString,
  release: UInt32,
}) {}

export type TBook = typeof Book;

// In reality you better to encrypt your private key and these information
// It will be better if your load it from .env file
const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  // This URL is for test environment
  url: 'https://test-serverless.zkdatabase.org/graphql',
});

// Check user existence then create
if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro-user');
}

// Sign in
await zkdb.auth.signIn();

// Create new instance of `db_test`
const dbTest = zkdb.db('db_test');

// Create new instance of collection `db_test.book`
const collectionBook = dbTest.collection<TBook>('book');

await collectionBook.insert({
  name: 'Brave New World',
  author: 'Aldous Huxley',
  release: 1932,
});

// Sign out
await zkdb.auth.signOut();
