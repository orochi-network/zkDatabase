import { PermissionRecord } from "../common/permission.js";

export type Permissions = {
  permissionOwner?: Partial<PermissionRecord>;
  permissionGroup?: Partial<PermissionRecord>;
  permissionOther?: Partial<PermissionRecord>;
};
