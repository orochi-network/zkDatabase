import { PermissionBinary } from '@common';
import { ModelCollectionMetadata, ModelDocumentMetadata } from '@model';
import { ClientSession } from 'mongodb';
import { CollectionMetadata } from '../types';
import { hasCollectionPermission, hasDocumentPermission } from './permission';

// eslint-disable-next-line import/prefer-default-export
export async function readMetadata(
  databaseName: string,
  collectionName: string,
  docId: string | null,
  actor: string,
  // eslint-disable-next-line default-param-last
  checkPermissions: boolean = false,
  session?: ClientSession
): Promise<CollectionMetadata> {
  if (checkPermissions) {
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
    permissionOwner: PermissionBinary.fromBinaryPermission(
      metadata.permissionOwner
    ),
    permissionGroup: PermissionBinary.fromBinaryPermission(
      metadata.permissionGroup
    ),
    permissionOther: PermissionBinary.fromBinaryPermission(
      metadata.permissionOther
    ),
  };
}
