import { CircuitString, Mina, PrivateKey, UInt64 } from 'o1js';
import { zkdb, NodeSigner, AuroWalletSigner, Schema } from 'zkdb';

const isBrowser = false;

const MY_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
);
const ZKDB_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKF6kkkpjruMD9G1jhZLhQE2o57H22iY5qAtvsAQTV2qfXSv6mrk'
);

const DB_NAME = 'shop';
const COLLECTION_NAME = 'clothes';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const Network = Mina.Network({
    mina: 'https://api.minascan.io/node/devnet/v1/graphql',
    archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
  });

  Mina.setActiveInstance(Network);

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(MY_PRIVATE_KEY);

    zkdb.connect(SERVER_URL, signer);

  await zkdb.auth.signIn();

  await zkdb.database('my-db').createGroup('group-name', 'group description');

  const collection = await zkdb.database(DB_NAME).from(COLLECTION_NAME);

  for (let i = 0; i < 10; i++) {
    await collection.insert(
      new TShirt({
        name: CircuitString.fromString(`Guchi ${i}`),
        price: UInt64.from(i),
      })
    );
  }

  await zkdb.auth.signOut();
}

await run();
