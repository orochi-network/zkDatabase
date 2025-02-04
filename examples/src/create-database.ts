import { zkdb } from './connection';

// Check user existence then create
if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@orochi.network');
}

// Sign in
await zkdb.auth.signIn();

// Create new instance of `db_test`
const dbTest = zkdb.db('db_test');

// Check for database existence,
// if database isn't exist create a new data with the capacity of 2^31
if (!(await dbTest.exist())) {
  await dbTest.create({ merkleHeight: 32 });
}

// Sign out
await zkdb.auth.signOut();
