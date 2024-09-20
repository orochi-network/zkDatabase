import {
  PermissionSet,
  Permissions,
  FullPermissions,
} from '../../domain/types/permission.js';

export type TPermissionSet = PermissionSet;

export type TPermissionGroup = 'User' | 'Group' | 'Other';

export type PermissionsData = Permissions;

export type FullPermissionsData = FullPermissions;
