import {
  TCollectionMetadata,
  TDocumentMetadata,
  TParamCollection,
  TParamDocument,
  TPermissionSudo,
} from '@zkdb/common';
import { DATABASE_ENGINE, ModelCollection } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { ModelMetadataCollection, ModelMetadataDocument } from '@model';
import { PermissionSecurity } from './permission-security';

// We create metadata class to manage all metadata of these model
// In Graphql metadata stay on it model FE: graphql metadata of document will be on document.ts
export class Metadata {
  public static async collection(
    paramCollection: TPermissionSudo<TParamCollection>,
    session?: ClientSession
  ): Promise<TCollectionMetadata | null> {
    const { sudo, databaseName, collectionName, actor } = paramCollection;

    const imMetadataCollection =
      ModelMetadataCollection.getInstance(databaseName);

    const metadataCollection = await imMetadataCollection.findOne(
      { collectionName },
      { session }
    );

    if (!metadataCollection) {
      return null;
    }

    const actorPermission = await PermissionSecurity.collection(
      {
        databaseName,
        collectionName,
        actor,
        // We going to reuse collection metadata from above to minimize the number of queries.
        sudo: sudo || metadataCollection,
      },
      session
    );

    if (!actorPermission.read) {
      return null;
    }

    const imCollection = ModelCollection.getInstance(
      databaseName,
      DATABASE_ENGINE.dbServerless,
      collectionName
    );

    const sizeOnDisk = await imCollection.size();

    return {
      ...metadataCollection,
      sizeOnDisk,
    };
  }

  public static async document(
    paramDocument: TPermissionSudo<TParamDocument>,
    session?: ClientSession
  ): Promise<TDocumentMetadata | null> {
    const { sudo, databaseName, collectionName, docId, actor } = paramDocument;

    const imMetadataDocument = new ModelMetadataDocument(databaseName);

    const metadataDocument = await imMetadataDocument.findOne(
      { docId, collectionName },
      { session }
    );

    if (!metadataDocument) {
      return null;
    }

    const actorPermissions = await PermissionSecurity.document(
      {
        databaseName,
        collectionName,
        docId,
        actor,
        sudo: sudo || metadataDocument,
      },
      session
    );

    if (!actorPermissions.read) {
      return null;
    }

    return metadataDocument;
  }
}
