import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TPermissions } from "../../types/ownership.js";
import { TSchema } from "../../types/schema.js";
const { gql } = pkg;

/**
 * Creates a new collection in the specified database.
 *
 * @function
 * @template TReturn - The return type of the mutation function.
 * @template TVariables - The variables required for the mutation.
 * @template TData - The data returned by the mutation.
 *
 * @param {string} databaseName - The name of the database where the collection will be created.
 * @param {string} collectionName - The name of the new collection.
 * @param {string} groupName - The name of the group associated with the collection.
 * @param {TSchema} schema - The schema definition for the collection.
 * @param {TPermissions} permissions - The permissions associated with the collection.
 *
 * @returns {TAsyncGraphQLResult<boolean>} - Returns true if the collection was successfully created, otherwise false.
 *
 * @example
 * ```typescript
 * const result = await createCollection({
 *   databaseName: 'myDatabase',
 *   collectionName: 'myCollection',
 *   groupName: 'myGroup',
 *   schema: [...],
 *   permissions: {...}
 * });
 * console.log(result); // true if successful
 * ```
 */
export const createCollection = createMutateFunction<
  boolean,
  {
    databaseName: string;
    collectionName: string;
    groupName: string;
    schema: TSchema;
    permissions: TPermissions;
  },
  { collectionCreate: boolean }
>(
  gql`
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
  `,
  (data) => data.collectionCreate
);
