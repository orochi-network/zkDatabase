import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const RENAME_GROUP = gql`
  mutation GroupRename(
    $databaseName: String!
    $groupName: String!
    $newGroupName: String!
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
  newGroupName: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { groupRename },
      errors,
    } = await client.mutate({
      mutation: RENAME_GROUP,
      variables: {
        databaseName,
        groupName,
        newGroupName,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<boolean>(groupRename);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};
