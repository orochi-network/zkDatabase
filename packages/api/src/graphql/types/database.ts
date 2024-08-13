export type Database = {
  name: string;
  merkleHeight: number;
  collections: string[];
  databaseSize: number;
};

export type DatabaseSettings = {
  merkleHeight: number;
  publicKey: string;
};

export type DatabaseStatus = {};
