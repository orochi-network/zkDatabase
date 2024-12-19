import { TDbRecord } from './common';

export type TSecureStorage = {
  privateKey: string;
  databaseName: string;
};

export type TSecureStorageRecord = TDbRecord<TSecureStorage>;
