import { ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';
import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  PermissionType,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission';
import { checkUserGroupMembership } from './group';
import { PermissionGroup, Permissions } from '../types/permission';

async function fetchPermissionDetails(
  databaseName: string,
  actor: string,
  metadata: PermissionBasic | null
): Promise<PermissionRecord> {
  if (!metadata) {
    return ZKDATABASE_NO_PERMISSION_RECORD;
  }

  if (metadata.owner === actor) {
    return PermissionBinary.fromBinaryPermission(metadata.permissionOwner);
  }

  if (await checkUserGroupMembership(databaseName, actor, metadata.group)) {
    return PermissionBinary.fromBinaryPermission(metadata.permissionGroup);
  }

  return PermissionBinary.fromBinary(metadata.permissionOther);
}

async function readPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  documentId?: ObjectId
): Promise<PermissionRecord> {
  const modelMetadata = documentId
    ? new ModelDocumentMetadata(databaseName)
    : ModelCollectionMetadata.getInstance(databaseName);

  const key = documentId
    ? { docId: documentId, collection: collectionName }
    : { collection: collectionName };
  const metadata = await modelMetadata.findOne(key);

  return fetchPermissionDetails(databaseName, actor, metadata);
}

async function checkPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId | undefined,
  type: PermissionType,
  isDocument: boolean
): Promise<boolean> {
  const permission = await readPermission(
    databaseName,
    collectionName,
    actor,
    isDocument ? docId : undefined
  );
  return permission[type];
}

export async function checkDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId,
  type: PermissionType
): Promise<boolean> {
  return checkPermission(
    databaseName,
    collectionName,
    actor,
    docId,
    type,
    true
  );
}

export async function checkCollectionPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  type: PermissionType
): Promise<boolean> {
  return checkPermission(
    databaseName,
    collectionName,
    actor,
    undefined,
    type,
    false
  );
}

export async function changePermissions(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId | null,
  group: PermissionGroup,
  permissions: PermissionRecord
) {
  const hasSystemPermission = docId
    ? await checkDocumentPermission(
        databaseName,
        collectionName,
        actor,
        docId!,
        'system'
      )
    : await checkCollectionPermission(
        databaseName,
        collectionName,
        actor,
        'system'
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

  let updatedPermission: Permissions = {
    permissionOwner: {
      ...permissions,
      system: group === 'Other' ? false : permissions.system,
    },
  };

  if (group === 'Group') {
    updatedPermission = { permissionGroup: permissions };
  }

  const updateQuery = docId
    ? { collection: collectionName, docId }
    : { collection: collectionName };

  await modelPermission.updateOne(updateQuery, updatedPermission);
}
