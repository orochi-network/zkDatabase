export type NetworkId = 'mainnet' | 'devnet';

export type Network = {
  networkId: NetworkId;
  endpoint: string;
};
