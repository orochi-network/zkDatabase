import { ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import { PermissionBinary, PermissionRecord, PermissionType } from '../../common/permission';
import { ModelSchema } from '../../model/database/schema';

async function checkDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId,
  type: PermissionType
): Promise<boolean> {
  const modelMetadata = new ModelDocumentMetadata(databaseName);

  const permission: PermissionRecord = await modelMetadata.getPermission(
    actor,
    collectionName,
    docId
  );

  return permission[type];
}

async function checkPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  type: PermissionType
): Promise<boolean> {
  const modelMetadata = ModelSchema.getInstance(databaseName);

  const permissionMetadata = await modelMetadata.getMetadata(collectionName);

  if (actor === permissionMetadata.owner) {
    return PermissionBinary.fromBinary(permissionMetadata.permissionOwner)[type];
  }

  if (actor === permissionMetadata.group) {
    return PermissionBinary.fromBinary(permissionMetadata.permissionGroup)[type];
  }

  return PermissionBinary.fromBinary(permissionMetadata.permissionOther)[type];
}


export {
  checkDocumentPermission,
  checkPermission
}