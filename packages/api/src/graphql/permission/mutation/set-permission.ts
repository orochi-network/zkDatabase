import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import {
  TOwnership,
  TOwnershipRequest,
  TPermissions,
} from "../../types/ownership.js";
const { gql } = pkg;

/**
 * Sets permissions for a specified document within a collection in a database.
 *
 * @function
 * @template TOwnership - The type representing the ownership details.
 * @template TOwnershipRequest - The type representing the ownership request details.
 * @param {TOwnershipRequest & { permission: TPermissions }} variables - The variables required for setting permissions, including database name, collection name, document ID, and the permission details.
 * @returns {TAsyncGraphQLResult<TOwnership>} - A promise that resolves to the ownership details with the updated permissions.
 */
export const setPermissions = createMutateFunction<
  TOwnership,
  TOwnershipRequest & {
    permission: TPermissions;
  },
  { permissionSet: TOwnership }
>(
  gql`
    mutation PermissionSet(
      $databaseName: String!
      $collectionName: String!
      $docId: String
      $permission: PermissionInput!
    ) {
      permissionSet(
        databaseName: $databaseName
        collectionName: $collectionName
        docId: $docId
        permission: $permission
      ) {
        userName
        groupName
        permissionOwner {
          read
          write
          delete
          create
          system
        }
        permissionGroup {
          read
          write
          delete
          create
          system
        }
        permissionOther {
          read
          write
          delete
          create
          system
        }
      }
    }
  `,
  (data) => data.permissionSet
);
