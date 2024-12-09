export type TTransactionType = 'deploy' | 'rollup';
export type TTransactionStatus =
  | 'start'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'success'
  | 'unknown';
export type TDbTransaction = {
  transactionObjectId: string;
  databaseName: string;
  status: TTransactionStatus;
  transactionType: TTransactionType;
  transactionRaw: string;
  zkAppPublicKey: string;
};
