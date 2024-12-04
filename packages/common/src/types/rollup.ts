import { ObjectId } from 'mongodb';
import { TDbRecord } from './common.js';
import { ETransactionStatus } from './transaction.js';

/**
 * Rollup state
 * @enum
 * @property {string} Updated - Rollup is up to date
 * @property {string} Updating - Rollup is updating
 * @property {string} Outdated - Rollup is outdated
 * @property {string} Failed - Rollup is errored
 */
export enum ERollUpState {
  Updated = 'Updated',
  Updating = 'Updating',
  Outdated = 'Outdated',
  Failed = 'Failed',
}

export type TRollUpHistory = {
  databaseName: string;
  currentMerkleTreeRoot: string;
  previousMerkleTreeRoot: string;
  // Previous name `txId` is changed to `transactionObjectId`,
  // txId is not a good name it's alias of tx hash
  transactionObjectId: ObjectId;
  proofObjectId: ObjectId;
};

// Compound Type
export type TRollUpTransactionHistory = TRollUpHistory & {
  transactionHash: string;
  createdAt: Date;
  status: ETransactionStatus;
  error?: string;
};

export type TRollUpHistoryRecord = TDbRecord<TRollUpHistory>;

export type RollUpData = {
  history: TRollUpHistory[];
  state: ERollUpState;
  extraData: number;
};
