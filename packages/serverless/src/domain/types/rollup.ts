import { TransactionStatus } from './transaction';

export type RollUpHistory = {
  databaseName: string;
  currentMerkleTreeRoot: string;
  previousMerkleTreeRoot: string;
  createdAt: Date;
  transactionHash?: string;
  status: TransactionStatus;
  error?: string;
};
