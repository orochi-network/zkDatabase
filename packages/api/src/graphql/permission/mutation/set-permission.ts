import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { PermissionSet, Permissions } from "../../types/ownership.js";

const SET_PERMISSION = gql`
  mutation PermissionSet(
    $databaseName: String!
    $collectionName: String!
    $docId: String
    $grouping: PermissionGroup!
    $permission: PermissionInput!
  ) {
    permissionSet(
      databaseName: $databaseName
      collectionName: $collectionName
      docId: $docId
      grouping: $grouping
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

interface ListPermissionResponse {
  permissions: Permissions;
}

export const setPermissions = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  permission: PermissionSet
): Promise<NetworkResult<Permissions>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate<{
      permissionSet: ListPermissionResponse;
    }>({
      mutation: SET_PERMISSION,
      variables: {
        databaseName,
        collectionName,
        docId,
        grouping,
        permission,
      },
    });

    const response = data?.permissionSet;

    if (response) {
      return {
        type: "success",
        data: response.permissions,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};
