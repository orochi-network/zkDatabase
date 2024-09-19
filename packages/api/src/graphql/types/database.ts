export type TDatabase = {
  databaseName: string;
  merkleHeight: number;
  collections: string[];
  databaseSize: number;
};

export type TDatabaseSettings = {
  merkleHeight: number;
  publicKey: string;
};

export type TDatabaseStatus = {};
