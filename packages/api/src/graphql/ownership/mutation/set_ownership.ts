import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { Ownership } from "../../types/ownership.js";

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

export const setOwner = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  newOwner: string
): Promise<NetworkResult<Ownership>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: SET_OWNER,
      variables: {
        databaseName,
        collectionName,
        docId,
        grouping,
        newOwner,
      }
    });

    const response = data?.permissionSet;

    if (response) {
      return {
        type: "success",
        data: response.permissionOwn
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};
