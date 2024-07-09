import { gql } from "@apollo/client";
import { Schema } from "../../types/schema";
import client from "../../client";
import { NetworkResult, handleRequest } from "../../../utils/network";

const CREATE_COLLECTION = gql`
  mutation CollectionCreate(
    $databaseName: String!
    $collectionName: String!
    $groupName: String!
    $schema: [SchemaFieldInput!]!
    $permissions: PermissionDetailInput
  ) {
    collectionCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      groupName: $groupName
      schema: $schema
      permissions: $permissions
    )
  }
`;

interface CreateCollectionResponse {
  success: boolean;
}

export const createCollection = async (
  databaseName: string,
  collectionName: string,
  groupName: string,
  schema: Schema,
  permissions: Permissions,
  token: string
): Promise<NetworkResult<undefined>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate<{
      collectionCreate: CreateCollectionResponse;
    }>({
      mutation: CREATE_COLLECTION,
      variables: {
        databaseName,
        collectionName,
        groupName,
        schema,
        permissions,
      },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.collectionCreate;

    if (response && response.success) {
      return {
        type: "success",
        data: undefined,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  })
};
