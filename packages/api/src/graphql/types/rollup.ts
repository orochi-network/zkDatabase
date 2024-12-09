export type TCreateRollUpRequest = {
  databaseName: string;
};

export type TGetRollUpHistoryResponse = {
  state: TRollUpState;
  history: {
    databaseName: string;
    merkletreeRootCurrent: string;
    merkletreeRootPrevious: string;
    status: TRollUpStatus;
    txHash: string;
    transactionType: TTransactionType;
    createdAt: Date;
    updatedAt: Date;
    error: string;
  };
  extraData: number;
};

export type TTransactionType = "deploy" | "rollup";
export type TRollUpStatus =
  | "start"
  | "ready"
  | "pending"
  | "failed"
  | "success"
  | "unknown";

export type TRollUpState = "updated" | "outdated" | "failed";
