import { gql } from "@apollo/client";
import {
  TOwnershipTransferRequest,
  TOwnershipTransferResponse,
  TPermissionSetRequest,
  TPermissionSetResponse,
} from "@zkdb/common";
import { createMutateFunction, TApolloClient } from "./common";

export const API_PERMISSION_OWNERSHIP = <T>(client: TApolloClient<T>) => ({
  ownershipTransfer: createMutateFunction<
    TOwnershipTransferRequest,
    TOwnershipTransferResponse
  >(
    client,
    gql`
      mutation ownershipTransfer(
        $databaseName: String!
        $collectionName: String!
        $docId: String
        $groupType: OwnershipGroup!
        $newOwner: String!
      ) {
        ownershipTransfer(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
          groupType: $groupType
          newOwner: $newOwner
        )
      }
    `,
    (data) => data.ownershipTransfer
  ),
  permissionSet: createMutateFunction<
    TPermissionSetRequest,
    TPermissionSetResponse
  >(
    client,
    gql`
      mutation permissionSet(
        $databaseName: String!
        $collectionName: String!
        $docId: String
        $permission: Int!
      ) {
        permissionSet(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
          permission: $permission
        )
      }
    `,
    (data) => data.permissionSet
  ),
});
