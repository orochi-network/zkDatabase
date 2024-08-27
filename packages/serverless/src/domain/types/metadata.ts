import { Owners } from './ownership.js';
import { FullPermissions } from './permission.js';

export type Metadata = {
  owners: Owners;
  permissions: FullPermissions;
};

export type DocumentMetadata = Metadata & {
  merkleIndex: string
}

export type WithMetadata<T> = T & { metadata: DocumentMetadata };