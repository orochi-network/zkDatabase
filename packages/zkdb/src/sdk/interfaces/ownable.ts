import { Permission } from '@zkdb/permission';
import { OwnershipAndPermission } from '../../types';

/* eslint-disable no-unused-vars */
export interface Ownable {
  changeGroup(groupName: string): Promise<void>;

  changeOwner(userName: string): Promise<void>;

  setPermission(permission: Permission): Promise<OwnershipAndPermission>;

  getPermission(): Promise<OwnershipAndPermission>;
}
