import { gql } from "@apollo/client";
import { handleRequest, NetworkResult } from "../../../utils/network";
import client from "../../client";
import { GroupInfo } from "../../types";

const GROUP_DESCRIPTION = gql`
  mutation GroupInfo($databaseName: String!, $groupName: String!) {
    groupInfo(databaseName: $databaseName, groupName: $groupName)
  }
`;

export const getGroupDescription = async (
  databaseName: string,
  groupName: string
): Promise<NetworkResult<GroupInfo>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: GROUP_DESCRIPTION,
      variables: {
        databaseName,
        groupName,
      },
    });

    const response = data?.groupInfo;

    if (response) {
      return {
        type: "success",
        data: response as any,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};
