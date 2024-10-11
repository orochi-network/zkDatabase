export type Database = {
  databaseName: string;
  merkleHeight: number;
  collections: string[];
  databaseSize: number;
};

export type DatabaseSettings = {
  publicKey: string;
  merkleHeight: number;
};
