import { Schema } from '@zkdb/common';
import { CircuitString, UInt32 } from 'o1js';
import { Permission } from 'zkdb';
import { zkdb } from './connection';

// Define the Book schema using Schema's create method and export it as TBook type alias for easy use in code
class Book extends Schema.create({
  name: CircuitString,
  author: CircuitString,
  release: UInt32,
}) {}

// Define a type alias for the Book schema
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
const collectionBook = dbTest.collection<TBook>(`book`);

// Define a group instance
const librarian = dbTest.group('librarian');

if (!(await librarian.exist())) {
  await librarian.create({ groupDescription: 'Group of librarians' });
}

// Create an
await collectionBook.create(
  Book,
  Permission.from({
    owner: {
      read: true,
      write: true,
      system: true,
      delete: true,
    },
    // Other users in this group can read and write
    group: {
      read: true,
      write: true,
    },
  }),
  'librarian'
);

// Sign out
await zkdb.auth.signOut();
