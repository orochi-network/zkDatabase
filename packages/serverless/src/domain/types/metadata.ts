import { Owners } from './ownership.js';
import { FullPermissions } from './permission.js';

export type Metadata = {
  owners: Owners;
  permissions: FullPermissions;
};
