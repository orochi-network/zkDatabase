import { Permissions } from './permission';

export type Ownership = {
  userName: string;
  groupName: string;
  permissions: Permissions;
};
