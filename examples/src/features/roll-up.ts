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

const MY_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
);
const ZKDB_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKF6kkkpjruMD9G1jhZLhQE2o57H22iY5qAtvsAQTV2qfXSv6mrk'
);

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

  await ZKDatabaseClient.auth().login('robot@gmail.com');

  const proof = await ZKDatabaseClient.context.useDatabase(DB_NAME).getProof();

  const tx = await ZKDatabaseClient.context
    .minaBlockchain()
    .rollUpZKDatabaseSmartContract(18, ZKDB_PRIVATE_KEY, proof);

  console.log('deployment hash', tx.hash);
  await tx.wait();

  await ZKDatabaseClient.auth().logOut();
})();
