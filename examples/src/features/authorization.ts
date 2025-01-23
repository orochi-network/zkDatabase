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

// Get information of current signed in user
console.log('Authorization getUser: ', zkdb.auth.getUser());

// Sign out
await zkdb.auth.signOut();
