import { PermissionDetail } from '@zkdb/permission';

export type Ownership = {
  userName: string;
  groupName: string;
};

export type OwnershipAndPermission = Ownership & PermissionDetail;
