import { ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';
import { Metadata } from '../types/metadata';
import {
  checkCollectionPermission,
  checkDocumentPermission,
} from './permission';
import { PermissionBinary } from '../../common/permission';

// eslint-disable-next-line import/prefer-default-export
export async function readMetadata(
  databaseName: string,
  collectionName: string,
  docId: ObjectId | null,
  actor: string,
  checkPermissions: boolean = false
): Promise<Metadata> {
  if (checkPermissions) {
    const hasReadPermission = docId
      ? await checkDocumentPermission(
          databaseName,
          collectionName,
          actor,
          docId,
          'read'
        )
      : await checkCollectionPermission(
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
    owners: {
      owner: metadata.owner,
      group: metadata.group,
    },
    permissions: {
      permissionOwner: PermissionBinary.fromBinaryPermission(
        metadata.permissionOwner
      ),
      permissionGroup: PermissionBinary.fromBinaryPermission(
        metadata.permissionGroup
      ),
      permissionOther: PermissionBinary.fromBinaryPermission(
        metadata.permissionOther
      ),
    },
  };
}
