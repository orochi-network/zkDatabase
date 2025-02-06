import { gql } from "@apollo/client";
import {
  TDocumentCreateRequest,
  TDocumentCreateResponse,
  TDocumentDropRequest,
  TDocumentDropResponse,
  TDocumentFindRequest,
  TDocumentFindResponse,
  TDocumentMetadataRequest,
  TDocumentMetadataResponse,
  TDocumentUpdateRequest,
  TDocumentUpdateResponse,
  TMerkleProofDocumentRequest,
  TMerkleProofDocumentResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_DOCUMENT = <T>(client: TApolloClient<T>) => ({
  documentCreate: createApi<TDocumentCreateRequest, TDocumentCreateResponse>(
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
    `
  ),
  documentDrop: createApi<TDocumentDropRequest, TDocumentDropResponse>(
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
    `
  ),
  documentUpdate: createApi<TDocumentUpdateRequest, TDocumentUpdateResponse>(
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
    `
  ),
  documentFind: createApi<TDocumentFindRequest, TDocumentFindResponse>(
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
          }
          total
          offset
        }
      }
    `
  ),
  documentHistoryFind: createApi<TDocumentFindRequest, TDocumentFindResponse>(
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
    `
  ),
  documentMetadata: createApi<
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
    (res) => {
      if (res === null) {
        return null;
      }

      const { merkleIndex, ...rest } = res;
      return {
        ...rest,
        merkleIndex: BigInt(merkleIndex),
      };
    }
  ),

  documentMerkleProofStatus: createApi<
    TMerkleProofDocumentRequest,
    TMerkleProofDocumentResponse
  >(
    client,
    gql`
      query documentMerkleProofStatus(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        documentMerkleProofStatus(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        )
      }
    `
  ),
});

export default API_DOCUMENT;
