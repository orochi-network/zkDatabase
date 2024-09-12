import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";
const GET_ROOT = gql`
  query GetRoot($databaseName: String!) {
    getRoot(databaseName: $databaseName)
  }
`;

export const getMerkleRoot = async (
  databaseName: string
): Promise<GraphQLResult<string>> => {
  try {
    const {
      data: { getRoot },
      errors,
    } = await client.query({
      query: GET_ROOT,
      variables: {
        databaseName,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<string>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<string>(getRoot);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<string>(error);
    } else {
      return GraphQLResult.wrap<string>(Error("Unknown Error"));
    }
  }
};
