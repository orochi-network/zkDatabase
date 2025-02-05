## Introduction

Data plays a critical role in any computational process, including the emerging Web3 era. In order to successfully transition to Web3, it is imperative to enhance accessibility and accuracy of data. The zkDatabase use a distributed storage engine that improves the availability of data. It utilizes Zero-Knowledge Proof to ensuring the correctness of data in verifiable manner. With zkDatabase, it's allow developers to focus on developing their ideas, rather than managing the complexities of data storage and management.

**It's time for verifiable data.**

## Installation

```bash
npm install zkdb graphql o1js
```

## Usage

```typescript
import { CircuitString, Field, UInt64, verify } from 'o1js';
import { Schema, ZkDatabase } from 'zkdb';

// In reality you better to encrypt your private key and these information
// It will be better if your load it from .env file
export const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  // Check the credential setup here https://test-doc.zkdatabase.org/getting-stated#setup-your-credentials for testnet
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  // This URL is for test environment
  url: 'https://test-serverless.zkdatabase.org/graphql',
});

// Check if user exists in the database or not, if it doesn't exist
// then sign up user and log him into system using his/her email id (e.g chiro@example.com)
if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@example.com');
}

// Sign in
await zkdb.auth.signIn();

// Create new instance of `db_test`
const dbTest = zkdb.db('db_test');

// Define schema for shirt collection
class Shirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const collectionShirt = dbTest.collection<typeof Shirt>('shirt');

console.log('Signin info:', await zkdb.auth.signIn());

// Check if database and collection exist or not, if not exist then create it
if (!(await zkdb.exists('chiro-user'))){
if (!(await dbTest.exist())) {
  await dbTest.create({ merkleHeight: 8 });
}

// Check if collection exist or not, If it doesn’t exists
// then create the table for `shirt` Collection in database (db_test).
if (!(await collectionShirt.exist())) {
  await collectionShirt.create(Shirt);
}

if ((await collectionShirt.findMany({})).total <= 0) {
  for (let i = 0; i < 10; i += 1) {
    // Insert 10 shirts into the `shirt` collection in database (db_test).
    await collectionShirt.insert({
      name: `zkDatabase ${i}`,
      price: 15n,
    });
  }
}

// Verify current ZKP of zkDatabase yourself
const verificationKey = await dbTest.verificationKey();
const zkDbProof = await dbTest.zkProof();

if (verificationKey && zkDbProof) {
  console.log(
    'Is valid zkProof:',
    await verify(zkDbProof.proof, verificationKey)
  );
}

// Use wrapped method of zkDatabase to verify ZKP
console.log('Verify result:', await dbTest.zkProofVerify());

// Check proving status
console.log('ZK Proof Status:', await dbTest.zkProofStatus());

// Get off-chain rollup state
console.log('Rollup Off-chain State:', await dbTest.rollUpOffChainState());

// Sign out
await zkdb.auth.signOut();
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details

**built with ❤️**
