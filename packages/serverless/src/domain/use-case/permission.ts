import { ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import {
  PermissionBinary,
  PermissionRecord,
  PermissionType,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';
import ModelUserGroup from '../../model/database/user-group';

export async function readDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  documentId: ObjectId
): Promise<PermissionRecord> {
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  const documentMetadata = await modelDocumentMetadata.findOne({
    docId: documentId,
    collection: collectionName,
  });

  if (documentMetadata) {
    // User == actor -> return user permission
    if (documentMetadata.owner === actor) {
      return PermissionBinary.fromBinaryPermission(
        documentMetadata.permissionOwner
      );
    }
    // User != actor -> check for group permission
    const modelUserGroup = new ModelUserGroup(databaseName!);
    const actorGroup = await modelUserGroup.listGroupByUserName(actor);
    if (actorGroup.includes(documentMetadata.group)) {
      return PermissionBinary.fromBinaryPermission(
        documentMetadata.permissionGroup
      );
    }
  }
  // Default deny all
  return ZKDATABASE_NO_PERMISSION_RECORD;
}

async function checkDocumentPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: ObjectId,
  type: PermissionType
): Promise<boolean> {
  const permission = await readDocumentPermission(
    databaseName,
    collectionName,
    actor,
    docId
  );

  return permission[type];
}

async function checkCollectionPermission(
  databaseName: string,
  collectionName: string,
  actor: string,
  type: PermissionType
): Promise<boolean> {
  const modelCollectionMetadata =
    ModelCollectionMetadata.getInstance(databaseName);

  const collectionMetadata =
    await modelCollectionMetadata.getMetadata(collectionName);

  if (!collectionMetadata) {
    return false;
  }

  if (actor === collectionMetadata.owner) {
    return PermissionBinary.fromBinary(collectionMetadata.permissionOwner)[
      type
    ];
  }

  if (actor === collectionMetadata.group) {
    return PermissionBinary.fromBinary(collectionMetadata.permissionGroup)[
      type
    ];
  }

  return PermissionBinary.fromBinary(collectionMetadata.permissionOther)[type];
}

export { checkDocumentPermission, checkCollectionPermission };
