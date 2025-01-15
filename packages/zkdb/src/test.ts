import { ZkDatabase } from './index';

/*
const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  url: 'http://zkdb-serverless.zenfactory.org/graphql',
});*/

const zkdb = await ZkDatabase.connect(
  'zkdb+http://chiro-user:EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP@zkdb-serverless.zenfactory.org/graphql'
);

if (!(await zkdb.auth.isUserExist('chiro-user'))) {
  await zkdb.auth.signUp('chiro@orochi.network');
}

console.log(await zkdb.auth.signIn());

if (!(await zkdb.db('zkdb_test').exist())) {
  await zkdb.db('zkdb_test').create({ merkleHeight: 8 });
}

console.log(await zkdb.db('zkdb_test').info());

await zkdb.auth.signOut();
