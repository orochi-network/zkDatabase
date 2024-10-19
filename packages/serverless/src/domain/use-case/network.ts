import { ModelNetwork } from '@zkdb/storage';

export async function fillNetworks() {
  const modelNetwork = ModelNetwork.getInstance();

  const networks = await (await modelNetwork.find()).toArray();

  if (networks.length === 0) {
    await modelNetwork.insertMany([
      {
        id: 'mainnet',
        endpoint: 'https://api.minascan.io/node/devnet/v1/graphql',
        active: true,
      },
      {
        id: 'devnet',
        endpoint: 'https://api.minascan.io/node/mainnet/v1/graphql',
        active: true,
      },
    ]);
  }
}
