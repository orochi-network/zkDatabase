import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const DATABASE_CREATE_MUTATION = gql`
  mutation DbCreate(
    $databaseName: String!
    $merkleHeight: Int!
    $publicKey: String!
  ) {
    dbCreate(
      databaseName: $databaseName
      merkleHeight: $merkleHeight
      publicKey: $publicKey
    )
  }
`;

export const createDatabase = async (
  databaseName: string,
  merkleHeight: number,
  appPublicKey: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { dbCreate },
      errors,
    } = await client.mutate({
      mutation: DATABASE_CREATE_MUTATION,
      variables: { databaseName, merkleHeight, publicKey: appPublicKey },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    if (typeof dbCreate === "boolean") {
      return GraphQLResult.wrap(dbCreate as boolean);
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
