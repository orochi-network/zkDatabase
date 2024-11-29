export const OWNERSHIP_TYPE = ['owner', 'group'] as const;

export const PERMISSION_TYPE = ['owner', 'group', 'other'] as const;

export const PERMISSION_FIELD = [
  'write',
  'read',
  'create',
  'delete',
  'system',
] as const;

export type PermissionType = (typeof PERMISSION_TYPE)[number];

export type OwnershipType = (typeof OWNERSHIP_TYPE)[number];

export type PermissionRecordKey = (typeof PERMISSION_FIELD)[number];

export const PERMISSION_ORDER_SYSTEM = 0;
export const PERMISSION_ORDER_CREATE = 1;
export const PERMISSION_ORDER_READ = 2;
export const PERMISSION_ORDER_WRITE = 3;
export const PERMISSION_ORDER_DELETE = 4;

export type PermissionRecord = {
  [k in PermissionRecordKey]: boolean;
};

export type PermissionDetail = {
  [key in PermissionType]: PermissionRecord;
};

export type PermissionDetailPartial = {
  [key in PermissionType]: Partial<PermissionRecord>;
};

export type Ownership = {
  [key in OwnershipType]: string;
};

export type OwnershipAndPermission = Ownership & {
  permission: number;
};

export type OwnershipAndPermissionDetail = Ownership & {
  owner: string;
  group: string;
  permission: PermissionDetail;
};
