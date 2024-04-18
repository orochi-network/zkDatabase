import { Owners } from "./ownership"
import { FullPermissions } from "./permission"

export type Metadata = {
  owners: Owners,
  permissions: FullPermissions
}