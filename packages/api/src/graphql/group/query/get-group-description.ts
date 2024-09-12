import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GroupInfo } from "../../types/group.js";
import { GraphQLResult } from "../../../utils/result.js";

const GROUP_DESCRIPTION = gql`
  mutation GroupInfo($databaseName: String!, $groupName: String!) {
    groupInfo(databaseName: $databaseName, groupName: $groupName)
  }
`;

export const getGroupDescription = async (
  databaseName: string,
  groupName: string
): Promise<GraphQLResult<GroupInfo>> => {
  try {
    const {
      data: { groupInfo },
      error,
    } = await client.query({
      query: GROUP_DESCRIPTION,
      variables: {
        databaseName,
        groupName,
      },
    });

    if (error) {
      return GraphQLResult.wrap<GroupInfo>(error);
    }

    return GraphQLResult.wrap(groupInfo);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<GroupInfo>(error);
    } else {
      return GraphQLResult.wrap<GroupInfo>(Error("Unknown Error"));
    }
  }
};
