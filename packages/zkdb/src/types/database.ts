export type Database = {
  databaseName: string;
  merkleHeight: number;
  collection: string[];
  databaseSize: number;
};

export type DatabaseSetting = {
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
