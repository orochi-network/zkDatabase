import { gql } from "@apollo/client";
import client from "../../client.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

const DATABASE_CREATE_MUTATION = gql`
  mutation DbCreate($databaseName: String!, $merkleHeight: Int!) {
    dbCreate(databaseName: $databaseName, merkleHeight: $merkleHeight)
  }
`;

export const createDatabase = async (
  databaseName: string,
  merkleHeight: number,
  appPublicKey: string,
  token: string
): Promise<NetworkResult<undefined>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate<{ dbCreate: boolean }>({
      mutation: DATABASE_CREATE_MUTATION,
      variables: { databaseName, merkleHeight, appPublicKey },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.dbCreate;

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
