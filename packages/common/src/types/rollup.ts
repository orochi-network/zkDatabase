import { ObjectId } from 'mongodb';
import { TDbRecord } from './common.js';
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

export type TRollUpHistory = TDbRecord<{
  databaseName: string;
  currentMerkleTreeRoot: string;
  previousMerkleTreeRoot: string;
  // Previous name `txId` is changed to `transactionObjectId`,
  // txId is not a good name it's alias of tx hash
  transactionObjectId: ObjectId;
  proofObjectId: ObjectId;
  transactionHash: string;
  status: ETransactionStatus;
  error: string;
}>;

export type RollUpData = {
  history: TRollUpHistory[];
  state: ERollUpState;
  extraData: number;
};
