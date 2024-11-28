export const PERMISSION_TYPE = ['owner', 'group', 'other'] as const;

export type PermissionType = (typeof PERMISSION_TYPE)[number];

export const PERMISSION_FIELD = [
  'write',
  'read',
  'create',
  'delete',
  'system',
] as const;

export const PERMISSION_ORDER_SYSTEM = 0;
export const PERMISSION_ORDER_CREATE = 1;
export const PERMISSION_ORDER_READ = 2;
export const PERMISSION_ORDER_WRITE = 3;
export const PERMISSION_ORDER_DELETE = 4;

export type PermissionRecordKey = (typeof PERMISSION_FIELD)[number];

export type PermissionRecord = {
  [k in PermissionRecordKey]: boolean;
};

export type PermissionDetail = {
  [key in PermissionType]: PermissionRecord;
};

export type PermissionDetailPartial = {
  [key in PermissionType]: Partial<PermissionRecord>;
};
