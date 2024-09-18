import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const EXIST_INDEX = gql`
  query IndexExist(
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexExist(
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

export const existIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { indexExist },
      error,
    } = await client.query({
      query: EXIST_INDEX,
      variables: { databaseName, collectionName, indexName },
    });

    if (error) {
      return GraphQLResult.wrap<boolean>(error);
    }

    if (typeof indexExist === "boolean") {
      return GraphQLResult.wrap(indexExist as boolean);
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
