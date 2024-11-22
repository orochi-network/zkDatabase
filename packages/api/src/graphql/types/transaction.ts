export type TTransactionRequest = {
  databaseName: string;
  transactionType: "deploy" | "rollup";
};

export type TTransactionConfirmRequest = {
  databaseName: string;
  confirmTransactionId: string;
  txHash: string;
};
export type TTransactionType = "deploy" | "rollup";
export type TTransactionStatus =
  | "start"
  | "ready"
  | "pending"
  | "failed"
  | "success"
  | "unknown";
export type TDbTransaction = {
  id: string;
  databaseName: string;
  status: TTransactionStatus;
  transactionType: TTransactionType;
  tx: string;
  zkAppPublicKey: string;
};
