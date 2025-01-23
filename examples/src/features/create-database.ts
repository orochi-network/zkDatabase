import { ZkDatabase } from 'zkdb';

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

// Check for database existence,
// if database isn't exist create a new data with the capacity of 2^31
if (!(await dbTest.exist())) {
  await dbTest.create({ merkleHeight: 32 });
}

// Sign out
await zkdb.auth.signOut();
