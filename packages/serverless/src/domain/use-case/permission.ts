import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  PermissionType,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '@common';
import { logger } from '@helper';
import { ModelCollectionMetadata, ModelDocumentMetadata } from '@model';
import { ClientSession } from 'mongodb';
import { FullPermissions, PermissionGroup } from '../types';
import { isDatabaseOwner } from './database';
import { checkUserGroupMembership } from './group';

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

export async function readPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  session?: ClientSession
): Promise<PermissionRecord> {
  const modelMetadata = docId
    ? new ModelDocumentMetadata(databaseName)
    : ModelCollectionMetadata.getInstance(databaseName);

  const key = docId
    ? { docId, collection: collectionName }
    : { collection: collectionName };
  const metadata = await modelMetadata.findOne(key, { session });

  return fetchPermissionDetails(databaseName, actor, metadata);
}

async function checkPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  type: PermissionType,
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
  return permission[type];
}

export async function hasDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string,
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

export async function hasCollectionPermission(
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
  docId: string | null,
  group: PermissionGroup,
  permissions: PermissionRecord,
  session?: ClientSession
) {
  const hasSystemPermission = docId
    ? await hasDocumentPermission(
        databaseName,
        collectionName,
        actor,
        docId!,
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

export async function setPermissions(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  permissions: FullPermissions,
  session?: ClientSession
): Promise<boolean> {
  const hasSystemPermission = docId
    ? await hasDocumentPermission(
        databaseName,
        collectionName,
        actor,
        docId!,
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
      ? new ModelDocumentMetadata(databaseName)
      : ModelCollectionMetadata.getInstance(databaseName);

    const update = {
      permissionOwner: PermissionBinary.toBinaryPermission({
        ...permissions.permissionOwner,
        system: false,
      }),
      permissionGroup: PermissionBinary.toBinaryPermission({
        ...permissions.permissionGroup,
      }),
      permissionOther: PermissionBinary.toBinaryPermission({
        ...permissions.permissionOther,
        system: false,
      }),
    };

    const updateQuery = { collection: collectionName, ...(docId && { docId }) };

    try {
      const result = await modelPermission.updateMany(
        updateQuery,
        { $set: update },
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
