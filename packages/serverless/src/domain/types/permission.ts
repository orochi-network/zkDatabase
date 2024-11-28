export type PermissionSet = {
  // Permission to change permission and ownership
  system: boolean;
  // Permission to create new record
  create: boolean;
  // Permission to read record
  read: boolean;
  // Permission to write on existing record
  write: boolean;
  // Permission to delete record
  delete: boolean;
};

export type Permission = {
  permissionOwner?: Partial<PermissionSet>;
  permissionGroup?: Partial<PermissionSet>;
  permissionOther?: Partial<PermissionSet>;
};

export type FullPermission = {
  permissionOwner: PermissionSet;
  permissionGroup: PermissionSet;
  permissionOther: PermissionSet;
};

export type PermissionGroup = 'User' | 'Group' | 'Other';
