import pkg from "@apollo/client";
const { gql } = pkg;
import { Schema } from "../../types/schema.js";
import client from "../../client.js";
import { Permissions } from "../../types/ownership.js";
import { GraphQLResult } from "../../../utils/result.js";

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
): Promise<GraphQLResult<undefined>> => {
  try {
    const { errors } = await client.mutate({
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
      return GraphQLResult.wrap<undefined>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<undefined>(error);
    } else {
      return GraphQLResult.wrap<undefined>(Error("Unknown Error"));
    }
  }
};
