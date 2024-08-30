import { PermissionRecord } from '../common/permission.js';

export type PermissionGroup = 'User' | 'Group' | 'Other';

export type Permissions = {
  permissionOwner?: Partial<PermissionRecord>;
  permissionGroup?: Partial<PermissionRecord>;
  permissionOther?: Partial<PermissionRecord>;
};

export class AccessPermissions {
  static readonly readOnlyPermissions: PermissionRecord = {
    write: false,
    read: true,
    create: false,
    delete: false,
    system: false,
  };

  static readonly fullAdminPermissions: PermissionRecord = {
    write: true,
    read: true,
    create: true,
    delete: true,
    system: true,
  };

  static readonly noPermissions: PermissionRecord = {
    write: false,
    read: false,
    create: false,
    delete: false,
    system: false,
  };

  static readonly fullAccessPermissions: PermissionRecord = {
    write: true,
    read: true,
    create: true,
    delete: true,
    system: false,
  };
}
