import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const REMOVE_USERS_GROUP = gql`
  mutation GroupRemoveUsers(
    $databaseName: String!
    $groupName: String!
    $userNames: [String!]!
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
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { groupRemoveUsers },
      errors,
    } = await client.mutate({
      mutation: REMOVE_USERS_GROUP,
      variables: {
        databaseName,
        groupName,
        userNames,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<boolean>(groupRemoveUsers);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};
