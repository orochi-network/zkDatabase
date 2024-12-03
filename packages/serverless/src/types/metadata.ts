import { OwnershipAndPermission } from '@zkdb/permission';
import { TSchemaFieldDefinition } from './schema.js';

export type TMetadataBasic = OwnershipAndPermission & {
  collection: string;
  createdAt: Date;
  updatedAt: Date;
};

// Document metadata
export type TMetadataDocument = TMetadataBasic & {
  docId: string;
  merkleIndex: string;
};

// Collection metadata
export type TMetadataCollection = TMetadataBasic & {
  field: string[];
  definition: TSchemaFieldDefinition[];
};

/**
 * Metadata detail for any type
 * @param T Type of base to be extended
 * @param M Type of metadata
 *
 */
export type TMetadataDetail<T, M> = T & { metadata: M };

export type TMetadataDetailDocument<T> = TMetadataDetail<T, TMetadataDocument>;

export type TMetadataDetailCollection<T> = TMetadataDetail<
  T,
  TMetadataCollection
>;
