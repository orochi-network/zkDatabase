import { CircuitString, Mina, NetworkId, PrivateKey, UInt64 } from 'o1js';
import { AuroWalletSigner, NodeSigner, Schema, ZKDatabaseClient } from 'zkdb';

const isBrowser = false;

const MY_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
);

const DB_NAME = 'shop';
const COLLECTION_NAME = 'clothes';
const NETWORK: NetworkId = 'testnet';
const MINA_ENDPOINT = 'https://api.minascan.io/node/devnet/v1/graphql';
class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const Network = Mina.Network({
    mina: MINA_ENDPOINT,
  });

  Mina.setActiveInstance(Network);

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(MY_PRIVATE_KEY, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signIn();

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

  await zkdb.authenticator.signOut();
}

await run();
