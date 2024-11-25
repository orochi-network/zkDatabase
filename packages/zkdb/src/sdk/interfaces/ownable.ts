import { Ownership, Permissions } from '../../types';

/* eslint-disable no-unused-vars */
export interface Ownable {
  changeGroup(groupName: string): Promise<void>;

  changeOwner(userName: string): Promise<void>;

  setPermissions(permissions: Permissions): Promise<Ownership>;

  getOwnership(): Promise<Ownership>;
}
