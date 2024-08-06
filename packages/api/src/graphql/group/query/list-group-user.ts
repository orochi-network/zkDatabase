import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

const LIST_GROUP_BY_USER = gql`
  query GroupListByUser($databaseName: String!, $userName: String!) {
    groupListByUser(databaseName: $databaseName, userName: $userName)
  }
`;

interface GroupResponse {
  groups: string[];
}

export const listGroupsByUser = async (
  databaseName: string,
  userName: string
): Promise<NetworkResult<string[]>> => {
  return handleRequest(async () => {
    const { data } = await client.query<{
      groupListByUser: GroupResponse;
    }>({
      query: LIST_GROUP_BY_USER,
      variables: { databaseName, userName },
    });

    const response = data?.groupListByUser;

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
