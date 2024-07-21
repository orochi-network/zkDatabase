import { ClientSession, ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';
import { Metadata } from '../types/metadata';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission';
import { PermissionBinary } from '../../common/permission';

// eslint-disable-next-line import/prefer-default-export
export async function readMetadata(
  databaseName: string,
  collectionName: string,
  docId: ObjectId | null,
  actor: string,
  // eslint-disable-next-line default-param-last
  checkPermissions: boolean = false,
  session?: ClientSession
): Promise<Metadata> {
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
