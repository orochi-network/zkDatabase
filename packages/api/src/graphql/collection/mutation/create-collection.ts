import pkg from '@apollo/client';
const { gql } = pkg;
import { Schema } from "../../types/schema.js";
import client from "../../client.js";
import { Permissions } from "../../types/permission.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

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

export const createCollection = async (
  databaseName: string,
  collectionName: string,
  groupName: string,
  schema: Schema,
  permissions: Permissions
): Promise<NetworkResult<undefined>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate({
      mutation: CREATE_COLLECTION,
      variables: {
        databaseName,
        collectionName,
        groupName,
        schema,
        permissions,
      },
    });

    const response = data?.collectionCreate;

    if (response) {
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
  });
};
