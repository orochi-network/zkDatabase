import { ObjectId, WithoutId } from 'mongodb';
import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TUser, TUserRecord } from './user.js';

export type TGroup = {
  groupName: string;
  groupDescription: string;
  // It's userName
  createdBy: string;
};

export type TUserGroup = {
  userName: string;
  groupName: string;
  groupOjectId: ObjectId;
  userObjectId: ObjectId;
};

export type TGroupRecord = TDbRecord<TGroup>;

export type TUserGroupRecord = TDbRecord<TUserGroup>;

export type TGroupRequest = TDatabaseRequest & Pick<TGroup, 'groupName'>;

export type TGroupUpdateRequest = TGroupRequest & {
  newGroupName: string;
  newGroupDescription: string;
};

export type TGroupUserInfo = Pick<
  TUserRecord,
  'userName' | 'createdAt' | 'updatedAt'
>;

export type TGroupListByUserRequest = TDatabaseRequest &
  Pick<TUser, 'userName'>;

export type TGroupListAllRequest = TDatabaseRequest;

export type TGroupListAllResponse = WithoutId<TGroupRecord>[];

export type TGroupInfoDetailRequest = TGroupRequest;

export type TGroupInfoDetailResponse = WithoutId<TGroupRecord> & {
  listUser: TGroupUserInfo[];
};

export type TGroupCreateRequest = TDatabaseRequest &
  Pick<TGroup, 'groupName' | 'groupDescription'>;

export type TGroupAddUsersRequest = TGroupRequest & {
  // List of userName
  listUser: string[];
};

// It the same, that's why we create new type as an alias
export type TGroupRemoveUsersRequest = TGroupAddUsersRequest;
