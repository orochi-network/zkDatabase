import { OwnershipAndPermission } from '@zkdb/permission';
import { TCollection } from './collection.js';
import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TDocument } from './document.js';

export type TMetadataBasic = OwnershipAndPermission;

// Document metadata
export type TMetadataDocument = TMetadataBasic & {
  collectionName: string;
  docId: string;
  merkleIndex: string;
};

export type TMetadataDocumentRecord = TDbRecord<TMetadataDocument>;

// Metadata from mongodb
export type TMetadataCollectionMongo = {
  sizeOnDisk: number;
};

// Collection metadata
export type TMetadataCollection = TMetadataDetail<
  TCollection & Partial<TMetadataCollectionMongo>,
  TMetadataBasic
>;

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

export type TMetadataDocumentRequest = TDatabaseRequest &
  Pick<TCollection, 'collectionName'> &
  Pick<TDocument, 'docId'>;

export type TMetadataCollectionRequest = Omit<
  TMetadataDocumentRequest,
  'docId'
>;
