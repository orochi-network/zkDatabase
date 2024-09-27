import { Collection } from "./collection.js";

export type Database = {
  databaseName: string;
  merkleHeight: number;
  collections: Collection[];
  databaseSize: number;
};
