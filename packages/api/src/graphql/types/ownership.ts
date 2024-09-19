export type TOwnership = {
  userName: string;
  groupName: string;
  permissions: TPermissions;
};

export type TPermissionSet = {
  system?: boolean;
  create?: boolean;
  read?: boolean;
  write?: boolean;
  delete?: boolean;
};

export type TPermissions = {
  permissionOwner?: TPermissionSet;
  permissionGroup?: TPermissionSet;
  permissionOther?: TPermissionSet;
};

export type TOwnershipRequest = {
  databaseName: string;
  collectionName: string;
  docId: string;
};
