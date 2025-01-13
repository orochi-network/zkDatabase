import type { ObjectId, WithoutId } from 'mongodb';
import { TDbRecord, TPickOptional } from './common.js';
import { TDatabaseRequest, TMetadataDatabase } from './database.js';
import { TUser, TUserRecord } from './user.js';

// For model layer type
export type TGroup = {
  groupName: string;
  groupDescription: string;
  // It's userName
  createdBy: string;
};

export type TUserGroup = {
  userName: string;
  groupName: string;
  groupObjectId: ObjectId;
  userObjectId: ObjectId;
};

export type TGroupRecord = TDbRecord<TGroup>;

export type TGroupDetail = TGroupRecord & { listUser: TGroupUserInfo[] };

export type TUserGroupRecord = TDbRecord<TUserGroup>;

// For use-case param type
export type TGroupParam = Pick<TGroup, 'groupName'> &
  Pick<TMetadataDatabase, 'databaseName'>;

export type TGroupParamCreate = TPickOptional<TGroup, 'groupDescription'> &
  Pick<TMetadataDatabase, 'databaseName'>;

export type TGroupParamUpdateMetadata = Pick<
  TGroupParamCreate,
  'databaseName' | 'groupName' | 'createdBy'
> & {
  newGroupName?: string;
  newGroupDescription?: string;
};

export type TGroupParamListUser = Pick<
  TGroupParamCreate,
  'databaseName' | 'groupName' | 'createdBy'
> & {
  listUserName: string[];
};

// For application layer type
export type TGroupRequest = TDatabaseRequest & Pick<TGroup, 'groupName'>;

export type TGroupUpdateRequest = TGroupRequest & {
  newGroupName?: string;
  newGroupDescription?: string;
};

export type TGroupUpdateResponse = boolean;

export type TGroupUserInfo = Pick<
  TUserRecord,
  'userName' | 'createdAt' | 'updatedAt'
>;

export type TGroupListByUserRequest = TDatabaseRequest & {
  userQuery: Partial<Pick<TUser, 'userName' | 'email' | 'publicKey'>>;
};

export type TGroupListByUserResponse = string[];

export type TGroupListAllRequest = TDatabaseRequest;

export type TGroupListAllResponse = WithoutId<TGroupRecord>[];

export type TGroupDetailRequest = TGroupRequest;

export type TGroupDetailResponse = TGroupDetail;

export type TGroupCreateRequest = TDatabaseRequest &
  TPickOptional<
    Pick<TGroup, 'groupName' | 'groupDescription'>,
    'groupDescription'
  >;

export type TGroupCreateResponse = boolean;

export type TGroupAddUserListRequest = TGroupRequest & {
  // List of userName
  listUser: string[];
};

export type TGroupAddUserListResponse = boolean;

// It the same, that's why we create new type as an alias
export type TGroupRemoveUserListRequest = TGroupAddUserListRequest;

export type TGroupRemoveUserListResponse = boolean;
