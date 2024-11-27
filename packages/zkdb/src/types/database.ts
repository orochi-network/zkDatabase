export type Database = {
  databaseName: string;
  merkleHeight: number;
  collections: string[];
  databaseSize: number;
};

export type DatabaseSettings = {
  publicKey: string;
  merkleHeight: number;
  databaseOwner: string;
};

export type DatabaseRecord = {
  databaseName: string;
  merkleHeight: number;
  appPublicKey?: string;
  databaseOwner: string;
};
