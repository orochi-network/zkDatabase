import {
  Permission,
  PermissionBase,
  PermissionRecordKey,
} from '@zkdb/permission';
import { ClientSession } from 'mongodb';
import logger from '../../helper/logger.js';
import {
  IMetadataCollection,
  ModelMetadataCollection,
} from '../../model/database/metadata-collection.js';
import ModelMetadataDocument, {
  IMetadataDocument,
} from '../../model/database/metadata-document.js';
import { isDatabaseOwner } from './database.js';
import { checkUserGroupMembership } from './group.js';

async function fetchPermissionDetail(
  databaseName: string,
  actor: string,
  metadata: IMetadataDocument | IMetadataCollection | null,
  session?: ClientSession
): Promise<number> {
  if (!metadata) {
    return 0;
  }

  const permission = Permission.from(metadata.permission);

  if (metadata.owner === actor) {
    return permission.owner.value;
  }

  if (
    await checkUserGroupMembership(databaseName, actor, metadata.group, session)
  ) {
    return permission.group.value;
  }

  return permission.other.value;
}

export async function readPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  session?: ClientSession
): Promise<number> {
  const modelMetadata = docId
    ? new ModelMetadataDocument(databaseName)
    : ModelMetadataCollection.getInstance(databaseName);

  const key = docId
    ? { docId, collection: collectionName }
    : { collection: collectionName };
  const metadata = await modelMetadata.findOne(key, { session });

  return fetchPermissionDetail(databaseName, actor, metadata);
}

async function checkPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  type: PermissionRecordKey,
  isDocument: boolean,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor)) {
    return true;
  }

  const permission = await readPermission(
    databaseName,
    collectionName,
    actor,
    isDocument ? docId : null,
    session
  );
  // Using PermissionBase to get a single group etc: owner, group, other
  return PermissionBase.from(permission)[type];
}

export async function hasDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string,
  type: PermissionRecordKey,
  session?: ClientSession
): Promise<boolean> {
  return checkPermission(
    databaseName,
    collectionName,
    actor,
    docId,
    type,
    true,
    session
  );
}

export async function hasCollectionPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  type: PermissionRecordKey,
  session?: ClientSession
): Promise<boolean> {
  return checkPermission(
    databaseName,
    collectionName,
    actor,
    null,
    type,
    false,
    session
  );
}

export async function setPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  permission: number,
  session?: ClientSession
): Promise<boolean> {
  const hasSystemPermission = docId
    ? await hasDocumentPermission(
        databaseName,
        collectionName,
        actor,
        docId,
        'system',
        session
      )
    : await hasCollectionPermission(
        databaseName,
        collectionName,
        actor,
        'system',
        session
      );

  if (hasSystemPermission) {
    const modelPermission = docId
      ? new ModelMetadataDocument(databaseName)
      : ModelMetadataCollection.getInstance(databaseName);

    const locationQuery = {
      collection: collectionName,
      ...(docId && { docId }),
    };

    const currentPermission = await modelPermission.findOne(locationQuery);

    if (!currentPermission) {
      throw Error('Metadata is empty');
    }
    // Force setting system set to false prevent API inject
    const permissionUpdate = Permission.from(permission);
    permissionUpdate.group.system = false;
    permissionUpdate.other.system = false;

    try {
      const result = await modelPermission.updateMany(
        locationQuery,
        {
          $set: {
            permission: permissionUpdate.value,
          },
        },
        { session }
      );

      return result.matchedCount === 1 && result.modifiedCount === 1;
    } catch (error) {
      logger.error('Failed to update permissions:', error);
      throw new Error('Error updating permissions.');
    }
  }

  const targetDescription = docId ? 'document' : 'collection';
  throw new Error(
    `Access denied: Actor '${actor}' does not have 'system' permission for the specified ${targetDescription}.`
  );
}
