import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

const LIST_GROUPS = gql`
  query GroupListAll($databaseName: String!) {
    groupListAll(databaseName: $databaseName)
  }
`;

interface GroupResponse {
  groups: string[];
}

export const listGroups = async (
  databaseName: string
): Promise<NetworkResult<string[]>> => {
  return handleRequest(async () => {
    const { data } = await client.query<{
      groupListAll: GroupResponse;
    }>({
      query: LIST_GROUPS,
      variables: { databaseName },
    });

    const response = data?.groupListAll;

    if (response) {
      return {
        type: "success",
        data: response as any,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};
