import { gql } from "@apollo/client";
import { handleRequest, NetworkResult } from "../../../utils/network";
import client from "../../client";

const CHANGE_GROUP_DESCRIPTION = gql`
  mutation GroupChangeDescription(
    $databaseName: String!,
    $groupName: String!,
    $groupDescription: String!,
  ) {
    groupChangeDescription(
      databaseName: $databaseName
      groupName: $groupName
      groupDescription: $groupDescription
    )
  }
`;

export const changeGroupDescription = async (
  databaseName: string,
  groupName: string,
  groupDescription: string
): Promise<NetworkResult<boolean>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: CHANGE_GROUP_DESCRIPTION,
      variables: {
        databaseName,
        groupName,
        groupDescription
      },
    });

    const response = data?.groupChangeDescription;

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
};