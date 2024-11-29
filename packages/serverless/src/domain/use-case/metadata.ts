import { ClientSession } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import { CollectionMetadata } from '../types/metadata.js';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';
import { PermissionBinary } from '../../common/permission.js';

// eslint-disable-next-line import/prefer-default-export
export async function readMetadata(
  databaseName: string,
  collectionName: string,
  docId: string | null,
  actor: string,
  // eslint-disable-next-line default-param-last
  checkPermission: boolean = false,
  session?: ClientSession
): Promise<CollectionMetadata> {
  if (checkPermission) {
    const hasReadPermission = docId
      ? await hasDocumentPermission(
          databaseName,
          collectionName,
          actor,
          docId,
          'read',
          session
        )
      : await hasCollectionPermission(
          databaseName,
          collectionName,
          actor,
          'read'
        );

    if (!hasReadPermission) {
      const targetDescription = docId ? 'document' : 'collection';
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified ${targetDescription}.`
      );
    }
  }

  const modelMetadata = docId
    ? new ModelDocumentMetadata(databaseName)
    : ModelCollectionMetadata.getInstance(databaseName);

  const key = docId
    ? { docId, collection: collectionName }
    : { collection: collectionName };

  const metadata = await modelMetadata.findOne(key);

  if (!metadata) {
    throw Error('Metadata has not been found');
  }

  return {
    userName: metadata.owner,
    groupName: metadata.group,
    permission: metadata.permission,
  };
}
