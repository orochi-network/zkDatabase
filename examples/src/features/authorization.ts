import { assert, Mina, NetworkId, PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner, ZKDatabaseClient } from 'zkdb';
import 'dotenv/config';
import { faker } from '@faker-js/faker';

const isBrowser = false;

const MINA_ENDPOINT = process.env.NETWORK_URL || '';
const NETWORK = process.env.NETWORK_ID as NetworkId;
const SERVER_URL = process.env.SERVERLESS_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

const DB_NAME = 'shop';
const zkdbUrl =
  'zkdb+https://username:EKEQy5SKbQEdD95JhQsMYfnRAqndtT9u4jXC2RTGMFJ2LXqRxEpP@test-serverless.zkdatabase.org/graphql?db=my-db';
async function run() {
  const zkdb = await ZKDatabaseClient.connect(zkdbUrl);

  // const Network = Mina.Network({
  //   networkId: NETWORK,
  //   mina: MINA_ENDPOINT,
  // });

  // Mina.setActiveInstance(Network);

  // const deployerPrivateKey = PrivateKey.fromBase58(DEPLOYER_PRIVATE_KEY);

  // const signer = isBrowser
  //   ? new AuroWalletSigner()
  //   : new NodeSigner(deployerPrivateKey, NETWORK);

  // const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  const fakeUser = {
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
  };

  // await zkdb.authenticator.signUp(fakeUser.username, fakeUser.email);

  await zkdb.authenticator.signIn();

  console.log('Authorization getUser: ', zkdb.authenticator.getUser());

  // await zkdb.authenticator.signOut();
}

await run();
