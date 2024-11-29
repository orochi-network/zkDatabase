import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import {
  TOwnership,
  TOwnershipAndPermissionRequest,
  TOwnershipAndPermissionResponse,
  TUser,
} from "./types";

export type TUserSignUpRecord = TUser;

export const permission = <T>(client: TApolloClient<T>) => ({
  set: createMutateFunction<
    TOwnership,
    TOwnershipAndPermissionRequest & {
      permission: number;
    },
    { permissionSet: TOwnershipAndPermissionResponse }
  >(
    client,
    gql`
      mutation PermissionSet(
        $databaseName: String!
        $collectionName: String!
        $docId: String
        $permission: PermissionDetailInput!
      ) {
        permissionSet(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
          permission: $permission
        ) {
          userName
          groupName
          permission
        }
      }
    `,
    (data) => data.permissionSet
  ),
  get: createQueryFunction<
    TOwnership,
    TOwnershipAndPermissionRequest,
    { permissionList: TOwnershipAndPermissionResponse }
  >(
    client,
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
          permission
        }
      }
    `,
    (data) => data.permissionList
  ),
});
