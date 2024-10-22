import { ClientSession } from 'mongodb';
import { DocumentSchemaInput } from '../types/schema.js';
import { getCurrentTime } from '../../helper/common.js';
import { Permissions } from '../types/permission.js';
import {
  PermissionBinary,
  partialToPermission,
} from '../../common/permission.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import { NetworkId } from '../types/network.js';

// eslint-disable-next-line import/prefer-default-export
export async function createCollectionMetadata(
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  schema: DocumentSchemaInput,
  permissions: Permissions,
  owner: string,
  group: string,
  session?: ClientSession
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

  for (let i = 0; i < schema.length; i += 1) {
    const { name, kind } = schema[i];
    schemaDef.fields.push(name);
    schemaDef[name] = {
      order: i,
      name,
      kind,
    };
  }

  await ModelCollectionMetadata.getInstance(databaseName, networkId).insertOne(schemaDef, {
    session,
  });
}
