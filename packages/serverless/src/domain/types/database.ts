import { Collection } from './collection';

export type Database = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collections: Collection[];
  databaseSize: number;
};
