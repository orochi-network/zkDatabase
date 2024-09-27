import { Collection } from './collection.js';

export type Database = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collections: Collection[];
  databaseSize: number;
};
