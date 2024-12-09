import { OwnershipAndPermission } from '@zkdb/permission';
import { TCollection } from './collection.js';
import { TDbRecord } from './common.js';

export type TMetadataBasic = OwnershipAndPermission & {
  collectionName: string;
};

// Document metadata
export type TMetadataDocument = TMetadataBasic & {
  docId: string;
  merkleIndex: string;
};

export type TMetadataDocumentRecord = TDbRecord<TMetadataDocument>;

// Collection metadata
export type TMetadataCollection = TMetadataBasic &
  TCollection & {
    sizeOnDisk: number;
  };

export type TMetadataCollectionRecord = TDbRecord<TMetadataCollection>;

/**
 * Not sure what this is for?
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
