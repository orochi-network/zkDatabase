import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { Owner } from "../../types/ownership.js";

const SET_OWNER = gql`
  mutation PermissionOwn(
    $databaseName: String!
    $collection: String!
    $docId: String
    $grouping: PermissionGroup!
    $newOwner: String!
  ) {
    permissionOwn(
      databaseName: $databaseName
      collection: $collection
      docId: $docId
      grouping: $grouping
      newOwner: $newOwner
    ) {
      userName
      groupName
    }
  }
`;

interface OwnershipResponse {
  userName: string;
  groupName: string;
}

export const setOwner = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  newOwner: string,
  token: string
): Promise<NetworkResult<Owner>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate<{
      permissionSet: OwnershipResponse;
    }>({
      mutation: SET_OWNER,
      variables: {
        databaseName,
        collectionName,
        docId,
        grouping,
        newOwner,
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
        data: {
          groupName: response.groupName,
          userName: response.userName,
        },
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};
