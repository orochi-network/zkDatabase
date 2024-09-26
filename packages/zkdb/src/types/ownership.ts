import { PermissionRecord } from "../common/permission.js";

export type Ownership = {
  userName: string,
  groupName: string,
  permissionOwner?: Partial<PermissionRecord>;
  permissionGroup?: Partial<PermissionRecord>;
  permissionOther?: Partial<PermissionRecord>;
}