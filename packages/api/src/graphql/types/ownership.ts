export type TOwnership = {
  userName: string;
  groupName: string;
};

export type TOwnershipAndPermissionRequest = {
  databaseName: string;
  collectionName: string;
  docId?: string;
};

export type TOwnershipAndPermissionResponse = {
  userName: string;
  groupName: string;
  permission: number;
};
