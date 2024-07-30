import pkg from '@apollo/client';
const { gql } = pkg;
import { Database } from "../../types/database.js";
import client from "../../client.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

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