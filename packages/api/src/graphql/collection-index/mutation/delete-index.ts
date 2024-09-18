import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const DELETE_INDEX = gql`
  mutation IndexDrop(
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexDrop(
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

export const deleteIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { indexDrop },
      errors,
    } = await client.mutate({
      mutation: DELETE_INDEX,
      variables: { databaseName, collectionName, indexName },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    if (typeof indexDrop === "boolean") {
      return GraphQLResult.wrap(indexDrop as boolean);
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
