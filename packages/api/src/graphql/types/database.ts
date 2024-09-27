import { Collection } from "./collection";

export type TDatabase = {
  databaseName: string;
  merkleHeight: number;
  collections: Collection[];
  databaseSize: number;
};

export type TDatabaseSettings = {
  merkleHeight: number;
  publicKey: string;
};

export type TDatabaseStatus = {};
