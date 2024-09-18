import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const CHANGE_GROUP_DESCRIPTION = gql`
  mutation GroupChangeDescription(
    $databaseName: String!
    $groupName: String!
    $groupDescription: String!
  ) {
    groupChangeDescription(
      databaseName: $databaseName
      groupName: $groupName
      groupDescription: $groupDescription
    )
  }
`;

export const changeGroupDescription = async (
  databaseName: string,
  groupName: string,
  groupDescription: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { groupChangeDescription },
      errors,
    } = await client.mutate({
      mutation: CHANGE_GROUP_DESCRIPTION,
      variables: {
        databaseName,
        groupName,
        groupDescription,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<boolean>(groupChangeDescription);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};
