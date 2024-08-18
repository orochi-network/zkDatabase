import { Permissions } from "./permission.js"

export type Ownership = {
  userName: string,
  groupName: string,
  permissions: Permissions
}