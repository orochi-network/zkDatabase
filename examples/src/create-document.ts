import { Schema } from '@zkdb/common';
import { CircuitString, UInt32 } from 'o1js';
import { zkdb } from './connection.js';

class Book extends Schema.create({
  name: CircuitString,
  author: CircuitString,
  release: UInt32,
}) {}

export type TBook = typeof Book;

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
