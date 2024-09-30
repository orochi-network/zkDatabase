import { PermissionSet } from './permission';

export type CollectionMetadata = {
  userName: string;
  groupName: string;
  permissionOwner: PermissionSet;
  permissionGroup: PermissionSet;
  permissionOther: PermissionSet;
};

export type DocumentMetadata = CollectionMetadata & {
  merkleIndex: string;
};

export type WithMetadata<T> = T & { metadata: DocumentMetadata };
