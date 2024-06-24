import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import client from "../../client";

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
        data: response.groups,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};
