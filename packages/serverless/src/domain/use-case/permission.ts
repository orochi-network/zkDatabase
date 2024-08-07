import { ClientSession, ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  PermissionType,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission.js';
import { checkUserGroupMembership } from './group.js';
import { PermissionGroup } from '../types/permission.js';
import logger from '../../helper/logger.js';

async function fetchPermissionDetails(
  databaseName: string,
  actor: string,
  metadata: PermissionBasic | null,
  session?: ClientSession
): Promise<PermissionRecord> {
  if (!metadata) {
    return ZKDATABASE_NO_PERMISSION_RECORD;
  }

  if (metadata.owner === actor) {
    return PermissionBinary.fromBinaryPermission(metadata.permissionOwner);
  }

  if (
    await checkUserGroupMembership(databaseName, actor, metadata.group, session)
  ) {
    return PermissionBinary.fromBinaryPermission(metadata.permissionGroup);
  }

  return PermissionBinary.fromBinary(metadata.permissionOther);
}

async function readPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  documentId: ObjectId | null,
  session?: ClientSession
): Promise<PermissionRecord> {
  const modelMetadata = documentId
    ? new ModelDocumentMetadata(databaseName)
    : ModelCollectionMetadata.getInstance(databaseName);

  const key = documentId
    ? { docId: documentId, collection: collectionName }
    : { collection: collectionName };
  const metadata = await modelMetadata.findOne(key, { session });

  return fetchPermissionDetails(databaseName, actor, metadata);
}

async function checkPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId | null,
  type: PermissionType,
  isDocument: boolean,
  session?: ClientSession
): Promise<boolean> {
  const permission = await readPermission(
    databaseName,
    collectionName,
    actor,
    isDocument ? docId : null,
    session
  );
  return permission[type];
}

export async function checkDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId,
  type: PermissionType,
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

export async function checkCollectionPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  type: PermissionType,
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

export async function changePermissions(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId | null,
  group: PermissionGroup,
  permissions: PermissionRecord,
  session?: ClientSession
) {
  const hasSystemPermission = docId
    ? await checkDocumentPermission(
        databaseName,
        collectionName,
        actor,
        docId!,
        'system',
        session
      )
    : await checkCollectionPermission(
        databaseName,
        collectionName,
        actor,
        'system',
        session
      );

  if (!hasSystemPermission) {
    const targetDescription = docId ? 'document' : 'collection';
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'system' permission for the specified ${targetDescription}.`
    );
  }

  const modelPermission = docId
    ? new ModelDocumentMetadata(databaseName)
    : ModelCollectionMetadata.getInstance(databaseName);

  let update: any;

  if (group === 'User') {
    update = {
      permissionOwner: PermissionBinary.toBinaryPermission({
        ...permissions,
      }),
    };
  } else if (group === 'Group') {
    update = {
      permissionGroup: PermissionBinary.toBinaryPermission(permissions),
    };
  } else {
    update = {
      permissionOther: PermissionBinary.toBinaryPermission({
        ...permissions,
        system: false,
      }),
    };
  }

  const updateQuery = { collection: collectionName, ...(docId && { docId }) };

  try {
    await modelPermission.updateMany(
      updateQuery,
      { $set: update },
      { session }
    );
  } catch (error) {
    logger.error('Failed to update permissions:', error);
    throw new Error('Error updating permissions.');
  }
}
