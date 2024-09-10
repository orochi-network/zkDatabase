import pkg from "@apollo/client";
const { gql } = pkg;
import { Schema } from "../../types/schema.js";
import client from "../../client.js";
import { Permissions } from "../../types/ownership.js";
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
    try {
      const {
        data: { collectionCreate },
        errors,
      } = await client.mutate({
        mutation: CREATE_COLLECTION,
        variables: {
          databaseName,
          collectionName,
          groupName,
          schema,
          permissions,
        },
      });

      if (errors) {
        return {
          type: "error",
          message: errors.map((error: any) => error.message).join(", "),
        };
      }

      if (collectionCreate) {
        return {
          type: "success",
          data: undefined,
        };
      } else {
        return {
          type: "error",
          message: "Failed to create collection. No data returned.",
        };
      }
    } catch (error) {
      return {
        type: "error",
        message: `An error occurred: ${(error as Error).message}`,
      };
    }
  });
};
