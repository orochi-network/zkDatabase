import { PermissionDetailPartial } from '@zkdb/permission';

export type PermissionGroup = 'User' | 'Group' | 'Other';

type MapPermission<T extends Record<string, any>> = {
  [Prop in keyof T as `permission${Capitalize<string & Prop>}`]: T[Prop];
};

export type Permission = MapPermission<PermissionDetailPartial>;
