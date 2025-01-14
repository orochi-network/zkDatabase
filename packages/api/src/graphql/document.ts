import { gql } from "@apollo/client";
import {
  TDocumentCreateRequest,
  TDocumentCreateResponse,
  TDocumentDropRequest,
  TDocumentDropResponse,
  TDocumentFindRequest,
  TDocumentFindResponse,
  TDocumentUpdateRequest,
  TDocumentUpdateResponse,
  TDocumentMetadataRequest,
  TDocumentMetadataResponse,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

export const API_DOCUMENT = <T>(client: TApolloClient<T>) => ({
  documentCreate: createMutateFunction<
    TDocumentCreateRequest,
    TDocumentCreateResponse
  >(
    client,
    gql`
      mutation documentCreate(
        $databaseName: String!
        $collectionName: String!
        $document: JSON!
        $documentPermission: Int
      ) {
        documentCreate(
          databaseName: $databaseName
          collectionName: $collectionName
          document: $document
          documentPermission: $documentPermission
        ) {
          docId
          acknowledged
          document
        }
      }
    `,
    (data) => data.documentCreate
  ),
  documentDrop: createMutateFunction<
    TDocumentDropRequest,
    TDocumentDropResponse
  >(
    client,
    gql`
      mutation documentDrop(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        documentDrop(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        ) {
          docId
          acknowledged
        }
      }
    `,
    (data) => data.documentDrop
  ),
  documentUpdate: createMutateFunction<
    TDocumentUpdateRequest,
    TDocumentUpdateResponse
  >(
    client,
    gql`
      mutation documentUpdate(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
        $document: JSON!
      ) {
        documentUpdate(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
          document: $document
        )
      }
    `,
    (data) => data.documentUpdate
  ),
  documentFind: createQueryFunction<
    TDocumentFindRequest,
    TDocumentFindResponse
  >(
    client,
    gql`
      query documentFind(
        $databaseName: String!
        $collectionName: String!
        $query: JSON
        $pagination: PaginationInput
      ) {
        documentFind(
          databaseName: $databaseName
          collectionName: $collectionName
          query: $query
          pagination: $pagination
        ) {
          data {
            docId
            document
            createdAt
            updatedAt
            metadata {
              owner
              group
              permission
              collectionName
              docId
              merkleIndex
            }
            queueStatus
          }
          total
          offset
        }
      }
    `,
    (data) => data.documentFind
  ),
  documentHistoryFind: createQueryFunction<
    TDocumentFindRequest,
    TDocumentFindResponse
  >(
    client,
    gql`
      query documentHistoryFind(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
        $pagination: PaginationInput
      ) {
        documentHistoryFind(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
          pagination: $pagination
        ) {
          data {
            createdAt
            document
            updatedAt
          }
          total
          offset
        }
      }
    `,
    (data) => data.documentHistoryFind
  ),
  documentMetadata: createQueryFunction<
    TDocumentMetadataRequest,
    TDocumentMetadataResponse
  >(
    client,
    gql`
      query documentMetadata(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        documentMetadata(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        ) {
          owner
          group
          permission
          collectionName
          docId
          merkleIndex
        }
      }
    `,
    (data) => data.documentMetadata
  ),
});
