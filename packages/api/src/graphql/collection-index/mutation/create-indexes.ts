import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const CREATE_INDEX = gql`
  mutation IndexCreate(
    $databaseName: String!
    $collectionName: String!
    $indexField: [String]!
  ) {
    indexCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      indexField: $indexField
    )
  }
`;

export const createIndexes = async (
  databaseName: string,
  collectionName: string,
  indexes: string[]
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { indexCreate },
      errors,
    } = await client.mutate({
      mutation: CREATE_INDEX,
      variables: { databaseName, collectionName, indexField: indexes },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    if (typeof indexCreate === "boolean") {
      return GraphQLResult.wrap(indexCreate as boolean);
    }

    return GraphQLResult.wrap<boolean>(
      new Error("Unexpected response format or type")
    );
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};
