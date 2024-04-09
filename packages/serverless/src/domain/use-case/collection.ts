import { ModelDatabase } from '@zkdb/storage';
import { Schema } from '../types/schema';
import { Permissions } from '../types/permission';
import { PermissionBinary, partialToPermission } from '../../common/permission';
import { ModelSchema } from '../../model/database/schema';

// eslint-disable-next-line import/prefer-default-export
export async function createCollection(
  databaseName: string,
  collectionName: string,
  owner: string,
  group: string,
  schema: Schema,
  permissions: Permissions
) {
  const modelDatabase = ModelDatabase.getInstance(databaseName);
  const modelSchema = ModelSchema.getInstance(databaseName);

  try {
    await modelDatabase.createCollection(collectionName);

    const permissionOwner = PermissionBinary.toBinaryPermission(
      partialToPermission(permissions.permissionOwner)
    );
    const permissionGroup = PermissionBinary.toBinaryPermission(
      partialToPermission(permissions.permissionGroup)
    );
    const permissionOther = PermissionBinary.toBinaryPermission(
      partialToPermission(permissions.permissionOthers)
    );

    await modelSchema.createSchema(collectionName, {
      schemas: schema,
      permission: {
        owner,
        group,
        permissionGroup,
        permissionOwner,
        permissionOther,
      },
    });
  } catch (error) {
    await modelDatabase.dropCollection(collectionName);
    throw error;
  }
}
