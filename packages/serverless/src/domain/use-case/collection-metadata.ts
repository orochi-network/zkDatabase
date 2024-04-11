import { ModelCollection } from "@zkdb/storage";
import { DocumentSchema } from "../types/schema";
import { getCurrentTime } from "../../helper/common";
import { Permissions } from "../types/permission";
import { PermissionBinary, partialToPermission } from "../../common/permission";
import { ModelCollectionMetadata } from "../../model/database/collection-metadata";

// eslint-disable-next-line import/prefer-default-export
export async function createCollectionMetadata(
  databaseName: string,
  collectionName: string,
  schema: DocumentSchema,
  permissions: Permissions,
  owner: string,
  group: string
) {
  const permissionOwner = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionOwner)
  );
  const permissionGroup = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionGroup)
  );
  const permissionOther = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionOther)
  );
  
  const schemaDef: any = {
    owner, 
    group,
    collection: collectionName,
    permissionOwner,
    permissionGroup,
    permissionOther,
    fields: [],
    createdAt: getCurrentTime(),
    updatedAt: getCurrentTime(),
  };
  const indexKeys = [];
  for (let i = 0; i < schema.length; i += 1) {
    const { name, kind, indexed } = schema[i];
    schemaDef.fields.push(name);
    schemaDef[name] = {
      order: i,
      name,
      kind,
      indexed,
    };
    if (indexed) {
      indexKeys.push(`${name}.name`);
    }
  }
  // Create index and collection
  await new ModelCollection(databaseName, collectionName).index(
    indexKeys
  );

  await ModelCollectionMetadata.getInstance(databaseName).insertOne(schemaDef)
}