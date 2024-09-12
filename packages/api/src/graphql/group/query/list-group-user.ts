import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const LIST_GROUP_BY_USER = gql`
  query GroupListByUser($databaseName: String!, $userName: String!) {
    groupListByUser(databaseName: $databaseName, userName: $userName)
  }
`;

export const listGroupsByUser = async (
  databaseName: string,
  userName: string
): Promise<GraphQLResult<string>> => {
  try {
    const {
      data: { groupListByUser },
      error,
    } = await client.query({
      query: LIST_GROUP_BY_USER,
      variables: { databaseName, userName },
    });

    if (error) {
      return GraphQLResult.wrap<string>(error);
    }

    return GraphQLResult.wrap(groupListByUser);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<string>(error);
    } else {
      return GraphQLResult.wrap<string>(Error("Unknown Error"));
    }
  }
};
