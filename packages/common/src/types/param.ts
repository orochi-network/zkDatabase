import { OwnershipAndPermission } from '@zkdb/permission';

export type TParam = {
  databaseName: string;
  collectionName: string;
  docId: string;
  actor: string;
  // You're able to use sudo to overwrite permission security, make sure you know what you're doing.
  sudo: OwnershipAndPermission;
};

export type TParamDocument = Omit<TParam, 'sudo'>;

export type TParamCollection = Omit<TParamDocument, 'docId'>;

export type TParamDatabase = Omit<TParamCollection, 'collectionName'>;

export type TPermissionSudo<T> = T & Partial<Pick<TParam, 'sudo'>>;
