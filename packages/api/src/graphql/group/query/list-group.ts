import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { GroupInfo } from '../../types/group.js';

const LIST_GROUPS = gql`
  query GroupListAll($databaseName: String!) {
    groupListAll(databaseName: $databaseName)
  }
`;

export const listGroups = async (
  databaseName: string
): Promise<NetworkResult<GroupInfo[]>> => {
  return handleRequest(async () => {
    const { data } = await client.query({
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
