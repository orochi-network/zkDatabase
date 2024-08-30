import {
  assert,
  CircuitString,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
  UInt64,
} from 'o1js';
import {
  ZKDatabaseClient,
  Signer,
  NodeSigner,
  AuroWalletSigner,
  QueryBuilder,
  DatabaseSearch,
  Schema,
  AccessPermissions,
} from 'zkdb';

const isBrowser = false;

const MY_PRIVATE_KEY = PrivateKey.fromBase58('EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3')
const ZKDB_PRIVATE_KEY = 'EKF6kkkpjruMD9G1jhZLhQE2o57H22iY5qAtvsAQTV2qfXSv6mrk'

const DB_NAME = 'shop';
const COLLECTION_NAME = 'clothes';
const GROUP_NAME = 'buyers';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

(async () => {
  const Network = Mina.Network({
    mina: 'https://api.minascan.io/node/devnet/v1/graphql',
    archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
  });

  Mina.setActiveInstance(Network);

  let signer: Signer;

  if (isBrowser) {
    signer = new AuroWalletSigner();
  } else {
    signer = new NodeSigner(MY_PRIVATE_KEY);
  }

  ZKDatabaseClient.setSigner(signer);

  await ZKDatabaseClient.auth().register('user-name', 'robot@gmail.com');

  await ZKDatabaseClient.auth().login('robot@gmail.com');

  const zkDbPrivateKey = PrivateKey.random();

  console.log('zkDbPrivateKey', zkDbPrivateKey.toBase58())

  const tx = await ZKDatabaseClient.context
    .minaBlockchain()
    .deployZKDatabaseSmartContract(18, zkDbPrivateKey);

  console.log('deployment hash', tx.hash);
  await tx.wait();

  await ZKDatabaseClient.context
    .global()
    .createDatabase(DB_NAME, 18, PublicKey.fromPrivateKey(zkDbPrivateKey));

  await ZKDatabaseClient.context
    .useDatabase(DB_NAME)
    .createGroup(GROUP_NAME, 'default description');

  await ZKDatabaseClient.context
    .useDatabase(DB_NAME)
    .createCollection(COLLECTION_NAME, GROUP_NAME, TShirt, {
      permissionOwner: AccessPermissions.fullAdminPermissions,
      permissionGroup: AccessPermissions.fullAccessPermissions,
      permissionOther: AccessPermissions.noPermissions,
    });

  const database = ZKDatabaseClient.context.useDatabase(DB_NAME);

  const collection = database.useCollection(COLLECTION_NAME);

  const witness1 = await collection.saveDocument(
    new TShirt({
      name: CircuitString.fromString('Guchi'),
      price: UInt64.from(12),
    })
  );

  // const witness2 = await collection.saveDocument(
  //   new TShirt({
  //     name: CircuitString.fromString('Guchi'),
  //     price: UInt64.from(13),
  //   })
  // );

  const document = await collection.getDocument({ name: 'Guchi' });

  console.log(await document?.getProofStatus());
  // if (document) {
  //   const guchi = await document.toSchema(TShirt);
  //   Provable.log(guchi);
  // }

  // const documents = await collection.getAvailableDocuments();

  // await database.getProof();

  await ZKDatabaseClient.auth().logOut();
})();
