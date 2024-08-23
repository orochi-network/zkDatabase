import pkg from '@apollo/client';
const { gql } = pkg;
import { handleRequest, NetworkResult } from "../../../utils/network.js";
import client from "../../client.js";

const REMOVE_USERS_GROUP = gql`
  mutation GroupRemoveUsers(
    $databaseName: String!,
    $groupName: String!,
    $userNames: [String!]!,
  ) {
    groupRemoveUsers(
      databaseName: $databaseName
      groupName: $groupName
      userNames: $userNames
    )
  }
`;

export const removeUsersFromGroup = async (
  databaseName: string,
  groupName: string,
  userNames: string[]
): Promise<NetworkResult<boolean>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: REMOVE_USERS_GROUP,
      variables: {
        databaseName,
        groupName,
        userNames
      },
    });

    const response = data?.groupRemoveUsers;

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

