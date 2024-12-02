import { TTransactionStatus } from './transaction';

export type TRollUpState = 'updated' | 'outdated' | 'failed';

export type TRollUpHistory = {
  databaseName: string;
  currentMerkleTreeRoot: string;
  previousMerkleTreeRoot: string;
  createdAt: Date;
  transactionHash?: string;
  status: TTransactionStatus;
  error?: string;
};

export type RollUpData = {
  history: TRollUpHistory[];
  state: TRollUpState;
  extraData: number;
};
