export type NetworkType = 'mainnet' | 'devnet';

export type Network = {
  networkType: NetworkType;
  endpoint: string;
};
