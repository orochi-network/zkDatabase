import pkg from '@apollo/client';
const { gql } = pkg;
import { handleRequest, NetworkResult } from "../../../utils/network.js";
import client from "../../client.js";

const RENAME_GROUP = gql`
  mutation GroupRename(
    $databaseName: String!,
    $groupName: String!,
    $newGroupName: String!,
  ) {
    groupRename(
      databaseName: $databaseName
      groupName: $groupName
      newGroupName: $newGroupName
    )
  }
`;

export const renameGroup = async (
  databaseName: string,
  groupName: string,
  newGroupName: string,
): Promise<NetworkResult<void>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: RENAME_GROUP,
      variables: {
        databaseName,
        groupName,
        newGroupName
      },
    });

    const response = data?.groupRename;

    if (response) {
      return {
        type: "success",
        data: response as any,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

