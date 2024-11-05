import { TransactionStatus } from './transaction';

export type RollUpState = 'updated' | 'outdated' | 'failed';

export type RollUpHistory = {
  databaseName: string;
  currentMerkleTreeRoot: string;
  previousMerkleTreeRoot: string;
  createdAt: Date;
  transactionHash?: string;
  status: TransactionStatus;
  error?: string;
};

export type RollUpData = {
  history: RollUpHistory[];
  state: RollUpState;
  extraData: number;
};
