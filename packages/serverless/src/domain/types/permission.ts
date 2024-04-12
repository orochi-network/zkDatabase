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

export type Permissions = {
  permissionOwner?: Partial<PermissionSet>;
  permissionGroup?: Partial<PermissionSet>;
  permissionOther?: Partial<PermissionSet>;
};
