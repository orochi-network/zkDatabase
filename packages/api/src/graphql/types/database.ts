import { TCollection } from "./collection";

export type TDatabase = {
  databaseName: string;
  merkleHeight: number;
  collection: TCollection[];
  databaseSize: number;
  publicKey: string;
  databaseOwner: string;
};

export type TDatabaseSettings = {
  merkleHeight: number;
  publicKey: string;
  databaseOwner: string;
};

export type TDatabaseStatus = {};

export type TDatabaseRecord = {
  databaseName: string;
  merkleHeight?: number;
};
