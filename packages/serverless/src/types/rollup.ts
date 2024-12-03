import { ETransactionStatus } from './transaction.js';

export enum ERollUpState {
  // Rollup is up to date
  Updated,
  // Rollup is updating, check [[ETransactionStatus]] for more detail
  Updating,
  // Rollup is outdated
  Outdated,
  // Rollup is errored, may be due to failed transaction
  Failed,
}

export type TRollUpHistory = {
  databaseName: string;
  currentMerkleTreeRoot: string;
  previousMerkleTreeRoot: string;
  createdAt: Date;
  transactionHash?: string;
  status: ETransactionStatus;
  error?: string;
};

export type RollUpData = {
  history: TRollUpHistory[];
  state: ERollUpState;
  extraData: number;
};
