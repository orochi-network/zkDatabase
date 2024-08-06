import { PermissionRecord } from '../common/permission.js';

export type PermissionGroup = 'User' | 'Group' | 'Other';

export type Permissions = {
  permissionOwner?: Partial<PermissionRecord>;
  permissionGroup?: Partial<PermissionRecord>;
  permissionOthers?: Partial<PermissionRecord>;
};

export const readOnlyPermissions: PermissionRecord = {
  write: false,
  read: true,
  create: false,
  delete: false,
  system: false,
};

export const fullAdminPermissions: PermissionRecord = {
  write: true,
  read: true,
  create: true,
  delete: true,
  system: true,
};

export const noPermissions: PermissionRecord = {
  write: false,
  read: false,
  create: false,
  delete: false,
  system: false,
};

export const fullAccessPermissions: PermissionRecord = {
  write: true,
  read: true,
  create: true,
  delete: true,
  system: false,
};