import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GroupInfo } from "../../types/group.js";
import { GraphQLResult } from "../../../utils/result.js";

const LIST_GROUPS = gql`
  query GroupListAll($databaseName: String!) {
    groupListAll(databaseName: $databaseName)
  }
`;

export const listGroups = async (
  databaseName: string
): Promise<GraphQLResult<GroupInfo>> => {
  try {
    const {
      data: { groupListAll },
      error,
    } = await client.query({
      query: LIST_GROUPS,
      variables: { databaseName },
    });
    if (error) {
      return GraphQLResult.wrap<GroupInfo>(error);
    }

    return GraphQLResult.wrap(groupListAll);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<GroupInfo>(error);
    } else {
      return GraphQLResult.wrap<GroupInfo>(Error("Unknown Error"));
    }
  }
};
