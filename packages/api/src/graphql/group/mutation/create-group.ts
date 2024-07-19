import { gql } from "@apollo/client";
import { handleRequest, NetworkResult } from "../../../utils/network";
import client from "../../client";

const CREATE_GROUP = gql`
  mutation GroupCreate(
    $databaseName: String!,
    $groupName: String!,
    $groupDescription: String,
  ) {
    groupCreate(
      databaseName: $databaseName
      groupName: $groupName
      groupDescription: $groupDescription
    )
  }
`;

export const createGroup = async (
  databaseName: string,
  groupName: string,
  groupDescription: string,
): Promise<NetworkResult<void>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: CREATE_GROUP,
      variables: {
        databaseName,
        groupName,
        groupDescription
      },
    });

    const response = data?.groupCreate;

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

