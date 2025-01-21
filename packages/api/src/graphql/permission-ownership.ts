import { gql } from "@apollo/client";
import {
  TOwnershipTransferRequest,
  TOwnershipTransferResponse,
  TPermissionSetRequest,
  TPermissionSetResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_PERMISSION_OWNERSHIP = <T>(client: TApolloClient<T>) => ({
  ownershipTransfer: createApi<
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
    `
  ),
  permissionSet: createApi<TPermissionSetRequest, TPermissionSetResponse>(
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
    `
  ),
});

export default API_PERMISSION_OWNERSHIP;
