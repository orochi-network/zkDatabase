import { NetworkId } from 'o1js';

export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

export function isNetwork(value: unknown): value is NetworkId {
  const validNetworks: NetworkId[] = ['mainnet', 'testnet'];
  return (
    typeof value === 'string' && validNetworks.includes(value as NetworkId)
  );
}
