import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TOwnership, TOwnershipRequest } from "../../types/ownership.js";
const { gql } = pkg;

/**
 * Sets the ownership of a document in a specified collection and database.
 *
 * @function
 * @template TInput - The input type for the mutation, which includes `userName` and `groupName` properties from `TOwnership`.
 * @template TRequest - The request type for the mutation, which extends `TOwnershipRequest` and includes a `permissionOwn` property of type `TOwnership`.
 * @template TResponse - The response type for the mutation, which includes a `permissionOwn` property of type `TOwnership`.
 *
 * @param {string} databaseName - The name of the database.
 * @param {string} collection - The name of the collection.
 * @param {string} [docId] - The ID of the document (optional).
 * @param {PermissionGroup} grouping - The permission group.
 * @param {string} newOwner - The new owner of the document.
 *
 * @returns {TAsyncGraphQLResult<{ userName: string; groupName: string }>} The new ownership details.
 */
export const setOwner = createMutateFunction<
  Pick<TOwnership, "userName" | "groupName">,
  TOwnershipRequest & { permissionOwn: TOwnership },
  { permissionOwn: Pick<TOwnership, "userName" | "groupName"> }
>(
  gql`
    mutation PermissionOwn(
      $databaseName: String!
      $collection: String!
      $docId: String
      $grouping: PermissionGroup!
      $newOwner: String!
    ) {
      permissionOwn(
        databaseName: $databaseName
        collection: $collection
        docId: $docId
        grouping: $grouping
        newOwner: $newOwner
      ) {
        userName
        groupName
      }
    }
  `,
  (data) => data.permissionOwn
);
