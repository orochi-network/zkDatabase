import pkg from '@apollo/client';
const { gql } = pkg;
import client from "../../client.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

const DATABASE_CHANGE_OWNER_MUTATION = gql`
  mutation DbChangeOwner($databaseName: String!, $newOwner: String!) {
    dbChangeOwner(databaseName: $databaseName, newOwner: $newOwner)
  }
`;

export const changeDatabaseOwner = async (
  databaseName: string,
  newOwner: string,
): Promise<NetworkResult<undefined>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate<{ dbChangeOwner: boolean }>({
      mutation: DATABASE_CHANGE_OWNER_MUTATION,
      variables: { databaseName, newOwner },
    });

    const response = data?.dbChangeOwner;

    if (response) {
      return {
        type: "success",
        data: undefined,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};
