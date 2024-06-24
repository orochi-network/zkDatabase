import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import client from "../../client";
import { PermissionSet, Permissions } from "../../types/permission";

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

export interface ListPermissionResponse {
  permissions: Permissions;
}

export const setPermissions = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  permission: PermissionSet,
  token: string
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
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
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
