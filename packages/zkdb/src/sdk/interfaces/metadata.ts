/* eslint-disable no-unused-vars */
import { Permission, OwnershipAndPermission } from '@zkdb/permission';

export interface IMetadata<T> {
  info(): Promise<T | null>;

  groupSet(groupName: string): Promise<boolean>;

  ownerSet(userName: string): Promise<boolean>;

  permissionSet(permission: Permission): Promise<boolean>;

  permissionGet(): Promise<OwnershipAndPermission | null>;
}
