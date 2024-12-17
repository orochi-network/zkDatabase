import {
  TMetadataCollection,
  TMetadataDocument,
  TParamCollection,
  TParamDocument,
  TPermissionSudo,
} from '@zkdb/common';
import { DATABASE_ENGINE, ModelCollection } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { ModelMetadataCollection, ModelMetadataDocument } from '@model';
import { PermissionSecurity } from './permission-security';

export class Metadata {
  public static async collection(
    paramCollection: TPermissionSudo<TParamCollection>,
    session?: ClientSession
  ): Promise<TMetadataCollection> {
    const { sudo, databaseName, collectionName, actor } = paramCollection;
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
    const actorPermission = await PermissionSecurity.collection(
      {
        databaseName,
        collectionName,
        actor,
        // We going to reuse metadata from above to minimize the number of queries.
        sudo: sudo || metadata.metadata,
      },
      session
    );

    if (!actorPermission.read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified collection`
      );
    }

    const modelCollection = ModelCollection.getInstance(
      databaseName,
      DATABASE_ENGINE.serverless,
      collectionName
    );

    const sizeOnDisk = await modelCollection.size();
    return {
      ...metadata,
      sizeOnDisk,
    };
  }

  public static async document(
    paramDocument: TPermissionSudo<TParamDocument>,
    session?: ClientSession
  ): Promise<TMetadataDocument> {
    const { sudo, databaseName, collectionName, docId, actor } = paramDocument;

    const modelMetadata = new ModelMetadataDocument(databaseName);

    const metadata = await modelMetadata.findOne(
      { docId, collectionName },
      { session }
    );

    if (!metadata) {
      throw Error('Metadata has not been found');
    }

    const actorPermissions = await PermissionSecurity.document(
      {
        databaseName,
        collectionName,
        docId,
        actor,
        sudo: sudo || metadata,
      },
      session
    );

    if (!actorPermissions.read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
      );
    }

    return metadata;
  }
}
