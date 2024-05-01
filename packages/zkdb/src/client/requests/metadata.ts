import { PermissionRecord } from '../../common/permission.js';
import { mutate, query } from '../graphql-client.js';
import { PermissionsData } from '../types/permissions.js';

export interface ListPermissionResponse {
  permissions: PermissionsData;
}

export const PERMISSION_LIST_QUERY = `
  query PermissionList($databaseName: String!, $collectionName: String!, $docId: String) {
    permissionList(databaseName: $databaseName, collectionName: $collectionName, docId: $docId) {
      userName
      groupName
      permissionOwner {
        read
        write
        delete
        create
        system
      }
      permissionGroup {
        read
        write
        delete
        create
        system
      }
      permissionOther {
        read
        write
        delete
        create
        system
      }
    }
  }
`;

export const PERMISSION_SET_MUTATION = `
  mutation PermissionSet(
    $databaseName: String!,
    $collectionName: String!,
    $docId: String,
    $grouping: PermissionGroup!,
    $permission: PermissionInput!
  ) {
    permissionSet(
      databaseName: $databaseName,
      collectionName: $collectionName,
      docId: $docId,
      grouping: $grouping,
      permission: $permission
    ) {
      userName
      groupName
      permissionOwner {
        read
        write
        delete
        create
        system
      }
    }
  }
`;

export const PERMISSION_OWN_MUTATION = `
  mutation PermissionOwn(
    $databaseName: String!,
    $collection: String!,
    $docId: String,
    $grouping: PermissionGroup!,
    $newOwner: String!
  ) {
    permissionOwn(
      databaseName: $databaseName,
      collection: $collection,
      docId: $docId,
      grouping: $grouping,
      newOwner: $newOwner
    ) {
      userName
      groupName
    }
  }
`;

export const listPermissions = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined
): Promise<ListPermissionResponse> => {
  const variables = { databaseName, collectionName, docId };
  try {
    const response = await query<{ permissionList: ListPermissionResponse }>(
      PERMISSION_LIST_QUERY,
      variables
    );

    const { permissionList } = response;

    return {
      permissions: permissionList as any
    };
  } catch (error) {
    throw new Error('ListPermissions failed: ' + error);
  }
};

export const setPermission = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  permission: PermissionRecord
): Promise<ListPermissionResponse> => {
  const variables = {
    databaseName,
    collectionName,
    docId,
    grouping,
    permission,
  };
  try {
    const response = await mutate<{ permissionSet: ListPermissionResponse }>(
      PERMISSION_SET_MUTATION,
      variables
    );
    const { permissionSet } = response;

    return {
      ...permissionSet,
    };
  } catch (error) {
    throw new Error('SetPermissions failed: ' + error);
  }
};

export const setOwnership = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  newOwner: string
): Promise<ListPermissionResponse> => {
  const variables = { databaseName, collectionName, docId, grouping, newOwner };
  try {
    const response = await mutate<{ permissionOwn: ListPermissionResponse }>(
      PERMISSION_OWN_MUTATION,
      variables
    );
    const { permissionOwn } = response;

    return {
      ...permissionOwn,
    };
  } catch (error) {
    throw new Error('OwnPermissions failed: ' + error);
  }
};
