import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import { MerkleWitness } from "../../types/merkle-tree";
import client from "../../client";
import { DocumentEncoded } from "../../types/document";
import { PermissionSet, Permissions } from "../../types/permission";

const LIST_PERMISSIONS = gql`
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


export interface ListPermissionResponse {
  permissions: Permissions;
}

export const listPermissions = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  token: string
): Promise<NetworkResult<Permissions>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query<{
      permissionList: ListPermissionResponse;
    }>({
      query: LIST_PERMISSIONS,
      variables: {
        databaseName,
        collectionName,
        docId,
      },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.permissionList;

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
