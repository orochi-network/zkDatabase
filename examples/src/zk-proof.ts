import { zkdb } from './connection';

// Sign in
await zkdb.auth.signIn();

// Create new instance of `db_test`
const dbTest = zkdb.db('db_test');

console.log(await dbTest.zkProof());

console.log(await dbTest.zkProofStatus());

// Sign out
await zkdb.auth.signOut();
