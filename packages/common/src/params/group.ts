import { TGroup } from '@types';

// Base TGroupParam
type TGroupParam = TGroup & {
  databaseName: string;
};

export type TGroupParamCreate = TGroupParam;

type TGroupDatabaseNameParam = Pick<TGroupParam, 'databaseName' | 'groupName'>;
export type TGroupParamExist = TGroupDatabaseNameParam;

export type TGroupParamDetail = TGroupDatabaseNameParam;

export type TGroupParamIsParticipant = TGroupDatabaseNameParam & {
  userName: string;
};

export type TGroupParamUpdateMetadata = Pick<
  TGroupParam,
  'databaseName' | 'groupName' | 'createdBy'
> & {
  newGroupName?: string;
  newDescription?: string;
};

export type TGroupParamAddListUser = Pick<
  TGroupParam,
  'databaseName' | 'createdBy' | 'groupName'
> & {
  listUserName: string[];
};
