import { PublicKey } from 'o1js';

export const DEFAULT_FEE  = 100_000_000 // 0.1 Mina

export type TransactionDetails = {
  sender: PublicKey;
  zkApp: PublicKey;
  fee?: number;
};
