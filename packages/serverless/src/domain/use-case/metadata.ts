import { ClientSession } from 'mongodb';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';

import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';
import { TMetadataCollection, TMetadataDocument } from '@zkdb/common';

export async function readCollectionMetadata(
  database: string,
  collection: string,
  actor: string,
  checkPermission = false,
  session?: ClientSession
): Promise<TMetadataCollection | null> {
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

  const modelMetadata = ModelMetadataCollection.getInstance(database);

  const metadata = await modelMetadata.findOne({ collection }, { session });

  return metadata;
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
