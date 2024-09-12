import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const CREATE_GROUP = gql`
  mutation GroupCreate(
    $databaseName: String!
    $groupName: String!
    $groupDescription: String
  ) {
    groupCreate(
      databaseName: $databaseName
      groupName: $groupName
      groupDescription: $groupDescription
    )
  }
`;

export const createGroup = async (
  databaseName: string,
  groupName: string,
  groupDescription: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { groupCreate },
      errors,
    } = await client.mutate({
      mutation: CREATE_GROUP,
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

    return GraphQLResult.wrap<boolean>(groupCreate);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};
