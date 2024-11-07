import { Collection } from './collection.js';
import { TransactionStatus } from './transaction.js';

export type Database = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collections: Collection[];
  databaseSize: number;
  appPublicKey?: string;
  deployStatus?: TransactionStatus
};
