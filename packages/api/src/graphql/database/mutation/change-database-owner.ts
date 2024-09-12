import pkg from '@apollo/client';
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const DATABASE_CHANGE_OWNER_MUTATION = gql`
  mutation DbChangeOwner($databaseName: String!, $newOwner: String!) {
    dbChangeOwner(databaseName: $databaseName, newOwner: $newOwner)
  }
`;

export const changeDatabaseOwner = async (
  databaseName: string,
  newOwner: string,
): Promise<GraphQLResult<boolean>> => {
  try {
    const { data : {dbChangeOwner}, errors } = await client.mutate({
      mutation: DATABASE_CHANGE_OWNER_MUTATION,
      variables: { databaseName, newOwner },
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    if (typeof dbChangeOwner === "boolean") {
      return GraphQLResult.wrap(dbChangeOwner as boolean);
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
