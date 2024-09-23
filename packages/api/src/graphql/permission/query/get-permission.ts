import pkg from "@apollo/client";
import { createMutateFunction } from "../../common.js";
import {
  TOwnership,
  TOwnershipRequest,
  TOwnershipResponse,
} from "../../types/ownership.js";
const { gql } = pkg;

/**
 * Fetches a list of permissions for a specified document in a collection within a database.
 *
 * @function
 * @template TOwnership - The type representing the ownership details.
 * @template TOwnershipRequest - The type representing the request details for ownership.
 *
 * @param {string} databaseName - The name of the database.
 * @param {string} collectionName - The name of the collection.
 * @param {string} [docId] - The optional ID of the document.
 *
 * @returns {TAsyncGraphQLResult<TOwnership>} - A promise that resolves to an object containing the list of permissions.
 *
 * @example
 * ```typescript
 * const permissions = await listPermissions({
 *   databaseName: 'myDatabase',
 *   collectionName: 'myCollection',
 *   docId: 'myDocumentId'
 * });
 * console.log(permissions);
 * ```
 */
export const listPermissions = createMutateFunction<
  TOwnership,
  TOwnershipRequest,
  { permissionList: TOwnershipResponse }
>(
  gql`
    query PermissionList(
      $databaseName: String!
      $collectionName: String!
      $docId: String
    ) {
      permissionList(
        databaseName: $databaseName
        collectionName: $collectionName
        docId: $docId
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
  (data) => ({
    userName: data.permissionList.userName,
    userGroup: data.permissionList.userGroup,
    permissions: {
      permissionOwner: data.permissionList.permissionOwner,
      permissionGroup: data.permissionList.permissionGroup,
      permissionOther: data.permissionList.permissionOther,
    },
  })
);
