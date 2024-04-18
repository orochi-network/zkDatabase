import { PermissionRecord } from '../common/permission.js';

export type PermissionGroup = 'User' | 'Group' | 'Other';

export type Permissions = {
  permissionOwner?: Partial<PermissionRecord>;
  permissionGroup?: Partial<PermissionRecord>;
  permissionOther?: Partial<PermissionRecord>;
};
