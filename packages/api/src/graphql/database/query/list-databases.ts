import { gql } from "@apollo/client";
import { Database } from "../../types/database";
import client from "../../client";
import { NetworkResult, handleRequest } from "../../../utils/network";

const LIST_DATABASES = gql`
query GetDbList {
  dbList
}
`;

export const listDatabases = async(): Promise<NetworkResult<Database[]>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query<{ dbList: any }>({
      query: LIST_DATABASES
    });

    const response = data?.dbList;

    if (response) {
      return {
        type: "success",
        data: response,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
}