import { OwnershipAndPermission } from '@zkdb/permission';

export type TMerkleMetadata = OwnershipAndPermission & {
  merkleIndex: string;
};

export type TWithMetadata<T> = T & { metadata: TMerkleMetadata };
