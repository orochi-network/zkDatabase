export type Ownership = {
  userName: string,
  groupName: string
  permissions: Permissions
}

export type PermissionSet = {
  system?: boolean;
  create?: boolean;
  read?: boolean;
  write?: boolean;
  delete?: boolean;
};

export type Permissions = {
  permissionOwner?: PermissionSet;
  permissionGroup?: PermissionSet;
  permissionOther?: PermissionSet;
};