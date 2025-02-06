import { zkdb } from './connection.js';

// Check user existence then create
if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@orochi.network');
}

// Sign in
await zkdb.auth.signIn();

// Get information of current signed in user
console.log('Authorization getUser: ', zkdb.auth.getUser());

// Sign out
await zkdb.auth.signOut();
