export type TTransactionType = 'deploy' | 'rollup';

export type TTransactionStatus =
  | 'start'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'success'
  | 'unknown';

export type TWaitTransactionStatus = Exclude<
  TTransactionStatus,
  'start' | 'unknown' | 'failed'
>;

export type TDbTransaction = {
  id: string;
  databaseName: string;
  status: TTransactionStatus;
  transactionType: TTransactionType;
  tx: string;
  zkAppPublicKey: string;
  error: string
};

export const transactionOrder: Map<TTransactionStatus, number> = new Map([
  ['start', 0],
  ['ready', 1],
  ['pending', 2],
  ['success', 3],
  ['failed', -1],
  ['unknown', -2],
]);
