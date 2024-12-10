import { ClientSession } from 'mongodb';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';

import { TMetadataCollection, TMetadataDocument } from '@zkdb/common';
import { DB, ModelCollection } from '@zkdb/storage';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';

export async function readCollectionMetadata(
  database: string,
  collection: string,
  actor: string,
  checkPermission = false,
  session?: ClientSession
): Promise<TMetadataCollection> {
  if (checkPermission) {
    const hasReadPermission = await hasCollectionPermission(
      database,
      collection,
      actor,
      'read',
      session
    );

    if (!hasReadPermission) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified collection`
      );
    }
  }

  const modelCollectionMetadata = ModelMetadataCollection.getInstance(database);

  const metadata = await modelCollectionMetadata.findOne(
    { collectionName: collection },
    { session }
  );
  if (!metadata) {
    throw new Error(
      `Cannot find metadata collection of ${collection} in database ${database}`
    );
  }

  const modelCollection = ModelCollection.getInstance(
    database,
    DB.service,
    collection
  );

  const sizeOnDisk = await modelCollection.size();
  return {
    ...metadata,
    sizeOnDisk,
  };
}

export async function readDocumentMetadata(
  database: string,
  collection: string,
  docId: string,
  actor: string,
  checkPermission = false,
  session?: ClientSession
): Promise<TMetadataDocument | null> {
  if (checkPermission) {
    const hasReadPermission = await hasDocumentPermission(
      database,
      collection,
      actor,
      docId,
      'read',
      session
    );

    if (!hasReadPermission) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
      );
    }
  }

  const modelMetadata = new ModelMetadataDocument(database);

  const metadata = await modelMetadata.findOne({ docId, collection });

  if (!metadata) {
    throw Error('Metadata has not been found');
  }

  return metadata;
}
