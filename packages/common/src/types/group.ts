import { TDatabaseRequest } from './database.js';

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
