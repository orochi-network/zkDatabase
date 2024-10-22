import { ClientSession } from 'mongodb';
import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  PermissionType,
  setPartialIntoPermission,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission.js';
import logger from '../../helper/logger.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import { FullPermissions, PermissionGroup } from '../types/permission.js';
import { isDatabaseOwner } from './database.js';
import { checkUserGroupMembership } from './group.js';
import { NetworkId } from '../types/network.js';

async function fetchPermissionDetails(
  networkId: NetworkId,
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
    await checkUserGroupMembership(
      databaseName,
      actor,
      metadata.group,
      networkId,
      session
    )
  ) {
    return PermissionBinary.fromBinaryPermission(metadata.permissionGroup);
  }

  return PermissionBinary.fromBinary(metadata.permissionOther);
}

export async function readPermission(
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  session?: ClientSession
): Promise<PermissionRecord> {
  const modelMetadata = docId
    ? ModelDocumentMetadata.getInstance(databaseName, networkId)
    : ModelCollectionMetadata.getInstance(databaseName, networkId);

  const key = docId
    ? { docId, collection: collectionName }
    : { collection: collectionName };
  const metadata = await modelMetadata.findOne(key, { session });

  return fetchPermissionDetails(networkId, databaseName, actor, metadata);
}

async function checkPermission(
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  type: PermissionType,
  isDocument: boolean,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, networkId)) {
    return true;
  }

  const permission = await readPermission(
    networkId,
    databaseName,
    collectionName,
    actor,
    isDocument ? docId : null,
    session
  );
  return permission[type];
}

export async function hasDocumentPermission(
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string,
  type: PermissionType,
  session?: ClientSession
): Promise<boolean> {
  return checkPermission(
    networkId,
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
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  actor: string,
  type: PermissionType,
  session?: ClientSession
): Promise<boolean> {
  return checkPermission(
    networkId,
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
  networkId: NetworkId,
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
        networkId,
        databaseName,
        collectionName,
        actor,
        docId!,
        'system',
        session
      )
    : await hasCollectionPermission(
        networkId,
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
    ? ModelDocumentMetadata.getInstance(databaseName, networkId)
    : ModelCollectionMetadata.getInstance(databaseName, networkId);

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
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string | null,
  permissions: FullPermissions,
  session?: ClientSession
): Promise<boolean> {
  const hasSystemPermission = docId
    ? await hasDocumentPermission(
        networkId,
        databaseName,
        collectionName,
        actor,
        docId!,
        'system',
        session
      )
    : await hasCollectionPermission(
        networkId,
        databaseName,
        collectionName,
        actor,
        'system',
        session
      );

  if (hasSystemPermission) {
    const modelPermission = docId
      ? ModelDocumentMetadata.getInstance(databaseName, networkId)
      : ModelCollectionMetadata.getInstance(databaseName, networkId);

    const locationQuery = {
      collection: collectionName,
      ...(docId && { docId }),
    };

    const currentPermissions = await modelPermission.findOne(locationQuery);

    if (!currentPermissions) {
      throw Error('Metadata is empty');
    }

    const permissionOwner = PermissionBinary.toBinaryPermission(
      setPartialIntoPermission(
        PermissionBinary.fromBinaryPermission(
          currentPermissions.permissionOwner
        ),
        permissions.permissionOwner
      )
    );

    const permissionGroup = PermissionBinary.toBinaryPermission(
      setPartialIntoPermission(
        PermissionBinary.fromBinaryPermission(
          currentPermissions.permissionGroup
        ),
        permissions.permissionGroup
      )
    );

    const permissionOther = PermissionBinary.toBinaryPermission({
      ...setPartialIntoPermission(
        PermissionBinary.fromBinaryPermission(
          currentPermissions.permissionOther
        ),
        permissions.permissionOther
      ),
      system: false,
    });

    PermissionBinary.fromBinary(permissionGroup);

    const update = {
      permissionOwner,
      permissionGroup,
      permissionOther,
    };

    try {
      const result = await modelPermission.updateMany(
        locationQuery,
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
