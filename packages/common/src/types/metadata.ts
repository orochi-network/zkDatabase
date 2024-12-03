import { OwnershipAndPermission } from '@zkdb/permission';
import { TSchemaField } from '../schema.js';
import { TDbRecord } from './common.js';

export type TMetadataBasic = TDbRecord<OwnershipAndPermission & {
  collection: string;
}>;

// Document metadata
export type TMetadataDocument = TMetadataBasic & {
  docId: string;
  merkleIndex: string;
};

// Collection metadata
export type TMetadataCollection = TMetadataBasic & {
  field: string[];
  definition: TSchemaField[];
};

/**
 * Metadata detail for any type
 * @param T Type of base to be extended
 * @param M Type of metadata
 *
 */
export type TMetadataDetail<T, M> = T & { _metadata: M };

export type TMetadataDetailDocument<T> = TMetadataDetail<T, TMetadataDocument>;

export type TMetadataDetailCollection<T> = TMetadataDetail<
  T,
  TMetadataCollection
>;
