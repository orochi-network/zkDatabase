import { ClientSession } from 'mongodb';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';

import { TMetadataCollection, TMetadataDocument } from '@zkdb/common';
import { DB, ModelCollection } from '@zkdb/storage';
import { PermissionSecurity } from './permission-security.js';

export async function readCollectionMetadata(
  databaseName: string,
  collectionName: string,
  actor: string,
  checkPermission = false,
  session?: ClientSession
): Promise<TMetadataCollection> {
  if (checkPermission) {
    const actorPermissions = PermissionSecurity.collection(
      databaseName,
      collectionName,
      actor,
      session
    );

    if (!(await actorPermissions).read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified collection`
      );
    }
  }

  const modelCollectionMetadata =
    ModelMetadataCollection.getInstance(databaseName);

  const metadata = await modelCollectionMetadata.findOne(
    { collectionName },
    { session }
  );
  if (!metadata) {
    throw new Error(
      `Cannot find metadata collection of ${collectionName} in database ${databaseName}`
    );
  }

  const modelCollection = ModelCollection.getInstance(
    databaseName,
    DB.service,
    collectionName
  );

  const sizeOnDisk = await modelCollection.size();
  return {
    ...metadata,
    sizeOnDisk,
  };
}

export async function readDocumentMetadata(
  databaseName: string,
  collectionName: string,
  docId: string,
  actor: string,
  checkPermission = false,
  session?: ClientSession
): Promise<TMetadataDocument | null> {
  if (checkPermission) {
    const actorPermissions = await PermissionSecurity.document(
      databaseName,
      collectionName,
      docId,
      actor,
      session
    );

    if (!actorPermissions.read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
      );
    }
  }

  const modelMetadata = new ModelMetadataDocument(databaseName);

  const metadata = await modelMetadata.findOne(
    { docId, collectionName },
    { session }
  );

  if (!metadata) {
    throw Error('Metadata has not been found');
  }

  return metadata;
}
