import { verify } from 'o1js';
import { zkdb } from './connection.js';

// Check user existence then create
if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@orochi.network');
}

// Sign in
await zkdb.auth.signIn();

// Create new instance of `db_test`
const dbTest = zkdb.db('db_test');

/**
 * To verify zkProof, you have 2 options
 * 1. Using our `zkProofVerify()`
 * 2. Using o1js `verify()`
 */

// 1. Using zkdb `zkProofVerify` method
/**
 * Basically it a wrapper that handle
 * get verification key, get zkProof
 * and verify from o1js to user
 * You just simply call it
 * */
console.log(await dbTest.zkProofVerify());

// 2. Using o1js `verify()`
/**
 * To verify using o1js, all you need is `zkProof` and `verificationKey`
 * Firstly, get verification key by calling `verificationKey()`
 * Secondly, get zkProof by calling `zkProof()`
 * Lastly, call the `verify()` from o1js
 * */

console.log('Off-chain ZK-data-rollups status:', await dbTest.proverStatus());

console.log('Off-chain rollup history:', await dbTest.rollUpOffChainHistory());

// Get verification key to verify
const verificationKey = await dbTest.verificationKey();

// Get zkProof to verify the proof
const zkProof = await dbTest.zkProof();

// Make sure we have both verification zkProof
if (verificationKey && zkProof) {
  // Verify proof via `verify` method from o1js
  console.log('Is proof valid:', await verify(zkProof.proof, verificationKey));
}

if ((await dbTest.proverStatus()) === 'Failed') {
  console.log('Retry:', await dbTest.proverRetry());
}

// Sign out
await zkdb.auth.signOut();
