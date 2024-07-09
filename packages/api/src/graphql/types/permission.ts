export type PermissionSet = {
  system?: boolean;
  create?: boolean;
  read?: boolean;
  write?: boolean;
  delete?: boolean;
};

export type Permissions = {
  permissionOwner: PermissionSet;
  permissionGroup: PermissionSet;
  permissionOthers: PermissionSet;
};