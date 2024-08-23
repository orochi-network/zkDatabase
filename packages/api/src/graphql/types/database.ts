export type Database = {
  databaseName: string;
  merkleHeight: number;
  collections: string[];
  databaseSize: number;
};

export type DatabaseSettings = {
  merkleHeight: number;
  publicKey: string;
};

export type DatabaseStatus = {};
