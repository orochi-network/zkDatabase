export type TTransactionType = 'deploy' | 'rollup';
export type TTransactionStatus =
  | 'start'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'success'
  | 'unknown';
export type TDbTransaction = {
  id: string;
  databaseName: string;
  status: TTransactionStatus;
  transactionType: TTransactionType;
  tx: string;
  zkAppPublicKey: string;
};
