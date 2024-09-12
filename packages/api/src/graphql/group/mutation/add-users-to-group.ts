import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const ADD_USERS_GROUP = gql`
  mutation GroupAddUsers(
    $databaseName: String!
    $groupName: String!
    $userNames: [String!]!
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
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { groupAddUsers },
      errors,
    } = await client.mutate({
      mutation: ADD_USERS_GROUP,
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

    return GraphQLResult.wrap<boolean>(groupAddUsers);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};
