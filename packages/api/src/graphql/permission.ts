import { gql } from "@apollo/client";
import { TMetadataBasic } from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

export const permission = <T>(client: TApolloClient<T>) => ({
  set: createMutateFunction<
    boolean,
    TMetadataBasic,
    { permissionSet: boolean }
  >(
    client,
    gql`
      mutation PermissionSet(
        $databaseName: String!
        $collectionName: String!
        $docId: String
        $permission: Number!
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
  // get: createQueryFunction<
  //   TOwnershipAndPermissionResponse,
  //   TOwnershipAndPermissionRequest,
  //   { permissionList: TOwnershipAndPermissionResponse }
  // >(
  //   client,
  //   gql`
  //     query PermissionList(
  //       $databaseName: String!
  //       $collectionName: String!
  //       $docId: String
  //     ) {
  //       permissionList(
  //         databaseName: $databaseName
  //         collectionName: $collectionName
  //         docId: $docId
  //       ) {
  //         userName
  //         groupName
  //         permission
  //       }
  //     }
  //   `,
  //   (data) => data.permissionList
  // ),
});
