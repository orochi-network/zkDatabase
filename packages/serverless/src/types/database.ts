import { TCollection } from './collection.js';
import { ETransactionStatus } from './transaction.js';

export type Database = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collection: TCollection[];
  databaseSize: number;
  appPublicKey?: string;
  deployStatus?: ETransactionStatus;
};
