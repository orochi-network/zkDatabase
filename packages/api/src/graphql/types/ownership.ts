export type TOwnership = {
  userName: string;
  groupName: string;
};

export type TOwnershipAndPermissionRequest = {
  databaseName: string;
  collectionName: string;
  docId?: string;
};

export type TOwnershipAndPermissionResponse = TOwnership & {
  permission: number;
};

export type TOwnershipAndPermission = TOwnershipAndPermissionResponse;
