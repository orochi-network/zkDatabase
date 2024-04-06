import client from '../graphql-client.js';

export interface ListPermissionResponse {
  permissions: JSON;
}

export interface GetPermissionResponse {
  permissions: JSON;
}

export const PERMISSION_LIST_QUERY = `
  query PermissionList($databaseName: String!, $collection: String!, $docId: String) {
    permissionList(databaseName: $databaseName, collection: $collection, docId: $docId) {
      userName
      groupName
      permissionOwner {
        read
        write
        delete
        insert
        system
      }
      permissionGroup {
        read
        write
        delete
        insert
        system
      }
      permissionOther {
        read
        write
        delete
        insert
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
        insert
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
  collection: string,
  docId?: string
): Promise<ListPermissionResponse> => {
  const variables = { databaseName, collection, docId };
  return client.request<ListPermissionResponse>(PERMISSION_LIST_QUERY, variables);
};

export const setPermission = async (
  databaseName: string,
  collectionName: string,
  docId: string,
  grouping: string,
  permission: any
): Promise<GetPermissionResponse> => {
  const variables = { databaseName, collectionName, docId, grouping, permission };
  return client.request(PERMISSION_SET_MUTATION, variables);
};

export const ownPermission = async (
  databaseName: string,
  collection: string,
  docId: string,
  grouping: string,
  newOwner: string
): Promise<GetPermissionResponse> => {
  const variables = { databaseName, collection, docId, grouping, newOwner };
  return client.request(PERMISSION_OWN_MUTATION, variables);
};
