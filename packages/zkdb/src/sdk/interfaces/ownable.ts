import { Permissions } from "../../types/permission.js";
import { Ownership } from "../../types/ownership.js";

/* eslint-disable no-unused-vars */
export interface Ownable {
  changeGroup(groupName: string): Promise<void>;
  changeOwner(userName: string): Promise<void>;
  setPermissions(permissions: Permissions): Promise<Permissions>;
  getOwnership(): Promise<Ownership>
}
