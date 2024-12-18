import { ObjectId, WithoutId } from 'mongodb';
import { TDbRecord } from './common.js';
import { TTransaction, TTransactionRecord } from './transaction.js';
import { TDatabaseRequest } from './database.js';
import { TProofRecord } from './proof.js';

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
  merkletreeRoot: string;
  merkletreeRootPrevious: string;
  // Previous name `txId` is changed to `transactionObjectId`,
  // txId is not a good name it's alias of tx hash
  transactionObjectId: ObjectId;
  proofObjectId: ObjectId;
};

export type TRollUpHistoryRecord = TDbRecord<TRollUpHistory>;

// Compound Type
export type TRollUpTransactionHistory = TRollUpHistory &
  WithoutId<TDbRecord<TTransaction>>;

export type TRollUpHistoryDetail = Pick<
  TRollUpHistoryRecord,
  'databaseName' | 'merkletreeRoot' | 'merkletreeRootPrevious'
> & {
  transaction: TTransactionRecord;
  proof: TProofRecord;
};

export type TRollUpDetail = {
  history: TRollUpHistoryDetail[];
  state: ERollUpState;
  // Number of merkle root transformatiion different to previous one
  rollUpDifferent: number;
};

// RollUp history
export type TRollupHistoryRequest = TDatabaseRequest;

export type TRollUpHistoryResponse = TRollUpDetail;

// Rolup create
export type TRollUpCreateRequest = TDatabaseRequest;

export type TRollUpCreateResponse = boolean;
