import { ObjectId } from 'mongodb';
import { TDatabaseRequest } from './database.js';
import { TDbRecord } from './common.js';

export type TGroupRequest = TDatabaseRequest & {
  groupName: string;
};

export type TGroupRenameRequest = TGroupRequest & {
  newGroupName: string;
};

export type TGroupCreateRequest = TGroupRequest & {
  groupDescription: string;
};

export type TGroupAddUsersRequest = TGroupRequest & {
  userNames: string[];
};

export type TUserGroup = {
  userName: string;
  userId: ObjectId;
  groupName: string;
  groupId: ObjectId;
};

export type TUserGroupRecord = TDbRecord<TUserGroup>;
