import { Collection } from './collection.js';
import { NetworkId } from './network.js';

export type Database = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collections: Collection[];
  databaseSize: number;
  networkId: NetworkId
};
