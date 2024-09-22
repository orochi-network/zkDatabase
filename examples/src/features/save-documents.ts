// import {
//   assert,
//   CircuitString,
//   Mina,
//   PrivateKey,
//   Provable,
//   PublicKey,
//   UInt64,
// } from 'o1js';
// import {
//   Signer,
//   NodeSigner,
//   AuroWalletSigner,
//   QueryBuilder,
//   DatabaseSearch,
//   Schema,
//   AccessPermissions,
//   zkdb,
// } from 'zkdb';

// const isBrowser = false;

// const MY_PRIVATE_KEY = PrivateKey.fromBase58(
//   'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
// );
// const ZKDB_PRIVATE_KEY = 'EKF62NTG7antqq6wDxFKt17q3EthV7AUmFmYL9rLLf72TtQx82jg';

// const DB_NAME = 'shop';
// const COLLECTION_NAME = 'clothes';
// const GROUP_NAME = 'buyers';

// class TShirt extends Schema.create({
//   name: CircuitString,
//   price: UInt64,
// }) {}

// (async () => {
//   const Network = Mina.Network({
//     mina: 'https://api.minascan.io/node/devnet/v1/graphql',
//     archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
//   });

//   Mina.setActiveInstance(Network);

//   let signer: Signer;

//   if (isBrowser) {
//     signer = new AuroWalletSigner();
//   } else {
//     signer = new NodeSigner(MY_PRIVATE_KEY);
//   }

//   zkdb.setSigner(signer);

//   await zkdb.auth.signUp('user-name', 'robot@gmail.com');

//   await zkdb.auth.signIn('robot@gmail.com');

//   const zkDbPrivateKey = PrivateKey.fromBase58(ZKDB_PRIVATE_KEY);

//   const tx = await zkdb
//     .fromBlockchain()
//     .deployZKDatabaseSmartContract(18, zkDbPrivateKey);

//   console.log('deployment hash', tx.hash);
//   await tx.wait();

//   await zkdb
//     .fromGlobal()
//     .createDatabase(DB_NAME, 18, PublicKey.fromPrivateKey(zkDbPrivateKey));

//   await zkdb.database(DB_NAME).createGroup(GROUP_NAME, 'default description');

//   await zkdb
//     .database(DB_NAME)
//     .createCollection(COLLECTION_NAME, GROUP_NAME, TShirt, {
//       permissionOwner: AccessPermissions.fullAdminPermissions,
//       permissionGroup: AccessPermissions.fullAccessPermissions,
//       permissionOther: AccessPermissions.noPermissions,
//     });

//   const shirt = new TShirt({
//     name: CircuitString.fromString('Guchi'),
//     price: UInt64.from(12),
//   });

//   await zkdb.database('my-db').from('my-collection').insert(shirt);

//   await zkdb.database('my-db').fromGroup('group-name');
//   await zkdb
//     .database('my-db')
//     .from('my-collection')
//     .insert(shirt, {
//       permissionOwner: {
//         read: true,
//         write: true,
//         delete: true,
//         create: true,
//         system: true,
//       },
//       permissionGroup: {
//         read: true,
//         write: true,
//         delete: true,
//         create: true,
//         system: true,
//       },
//       permissionOther: {
//         read: true,
//         write: true,
//         delete: true,
//         create: true,
//         system: true,
//       },
//     });

//   const database = zkdb.database(DB_NAME);

//   const collection = database.from(COLLECTION_NAME);

//   const witness1 = await collection.insert(
//     new TShirt({
//       name: CircuitString.fromString('Guchi'),
//       price: UInt64.from(12),
//     })
//   );

//   const document = await collection.fetchOne({ name: 'Guchi' });

//   console.log(await document?.getProofStatus());

//   await zkdb.auth.signOut();
// })();
