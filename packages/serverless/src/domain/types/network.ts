export type NetworkId = 'mainnet' | 'devnet';

export type Network = {
  networkType: NetworkId;
  endpoint: string;
};
