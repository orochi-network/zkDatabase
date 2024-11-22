import { TTransactionType } from './transaction';

export type TGetRollUpHistory = {
  state: TRollUpState;
  history: {
    createdAt: Date;
    currentMerkleTreeRoot: string;
    databaseName: string;
    previousMerkleTreeRoot: string;
    status: TRollUpStatus;
    transactionHash: string;
    transactionType: TTransactionType;
    error: string;
  };
  extraData: number;
};

export type TRollUpStatus =
  | 'start'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'success'
  | 'unknown';

export type TRollUpState = 'updated' | 'outdated' | 'failed';
