import { ModelNetwork } from '@zkdb/storage';
import { Network } from '../types/network';

export async function fillNetworks() {
  const modelNetwork = ModelNetwork.getInstance();

  const networks = await (await modelNetwork.find()).toArray();

  if (networks.length === 0) {
    await modelNetwork.insertMany([
      {
        networkId: 'mainnet',
        endpoint: 'https://api.minascan.io/node/mainnet/v1/graphql',
        active: true,
      },
      {
        networkId: 'devnet',
        endpoint: 'https://api.minascan.io/node/devnet/v1/graphql',
        active: true,
      },
    ]);
  }
}

export async function getNetworks(): Promise<Network[]> {
  const modelNetwork = ModelNetwork.getInstance();

  return (await modelNetwork.find()).toArray();
}
