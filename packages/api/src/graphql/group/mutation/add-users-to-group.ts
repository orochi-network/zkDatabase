import pkg from '@apollo/client';
const { gql } = pkg;
import { handleRequest, NetworkResult } from "../../../utils/network.js";
import client from "../../client.js";

const ADD_USERS_GROUP = gql`
  mutation GroupAddUsers(
    $databaseName: String!,
    $groupName: String!,
    $userNames: [String!]!,
  ) {
    groupAddUsers(
      databaseName: $databaseName
      groupName: $groupName
      userNames: $userNames
    )
  }
`;

export const addUsersToGroup = async (
  databaseName: string,
  groupName: string,
  userNames: string[]
): Promise<NetworkResult<boolean>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: ADD_USERS_GROUP,
      variables: {
        databaseName,
        groupName,
        userNames
      },
    });

    const response = data?.groupAddUsers;

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

