import { gql } from "@apollo/client";
import {
  TDocumentCreateRequest,
  TDocumentFindRequest,
  TDocumentHistoryGetRequest,
  TDocumentListFindRequest,
  TDocumentListFindResponse,
  TDocumentReadResponse,
  TDocumentResponse,
  TDocumentUpdateRequest,
  TSingleDocumentHistory,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

const DOCUMENT_DELETE = gql`
  mutation DocumentDrop(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
  ) {
    documentDrop(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
    ) {
      isLeft
      sibling
    }
  }
`;

const DOCUMENT_CREATE = gql`
  input DocumentRecordInput {
    name: String!
    kind: String!
    value: String!
  }

  mutation DocumentCreate(
    $databaseName: String!
    $collectionName: String!
    $documentRecord: [DocumentRecordInput!]!
    $documentPermission: Number
  ) {
    documentCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      documentRecord: $documentRecord
      documentPermission: $documentPermission
    ) {
      isLeft
      sibling
    }
  }
`;

const DOCUMENT_UPDATE = gql`
  mutation DocumentUpdate(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
    $documentRecord: [DocumentRecordInput!]!
  ) {
    documentUpdate(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
      documentRecord: $documentRecord
    ) {
      isLeft
      sibling
    }
  }
`;

const DOCUMENT_FIND_ONE = gql`
  query DocumentFind(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
  ) {
    documentFind(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
    ) {
      docId
      field {
        name
        kind
        value
      }
      createdAt
    }
  }
`;

const DOCUMENT_FIND_MANY = gql`
  query DocumentsFind(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
    $pagination: PaginationInput
  ) {
    documentsFind(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
      pagination: $pagination
    ) {
      totalSize
      offset
      data {
        docId
        field {
          name
          kind
          value
        }
        createdAt
      }
    }
  }
`;

const DOCUMENT_HISTORY = gql`
  query HistoryDocumentGet(
    $databaseName: String!
    $collectionName: String!
    $docId: String!
  ) {
    historyDocumentGet(
      databaseName: $databaseName
      collectionName: $collectionName
      docId: $docId
    ) {
      docId
      documents {
        docId
        fields {
          name
          kind
          value
        }
        createdAt
      }
    }
  }
`;

export const document = <T>(client: TApolloClient<T>) => ({
  drop: createMutateFunction<
    TDocumentResponse,
    TDocumentFindRequest,
    { documentDrop: TDocumentResponse }
  >(client, DOCUMENT_DELETE, (data) => data.documentDrop),
  create: createMutateFunction<
    TDocumentResponse,
    TDocumentCreateRequest,
    { documentCreate: TDocumentResponse }
  >(client, DOCUMENT_CREATE, (data) => data.documentCreate),
  update: createMutateFunction<
    TDocumentResponse,
    TDocumentUpdateRequest,
    { documentUpdate: TDocumentResponse }
  >(client, DOCUMENT_UPDATE, (data) => data.documentUpdate),
  findOne: createQueryFunction<
    TDocumentReadResponse | null,
    { databaseName: string; collectionName: string; documentQuery: any },
    { documentFind: TDocumentReadResponse | null }
  >(client, DOCUMENT_FIND_ONE, (data) => data.documentFind),
  findMany: createQueryFunction<
    TDocumentListFindResponse,
    TDocumentListFindRequest,
    { documentsFind: TDocumentListFindResponse }
  >(client, DOCUMENT_FIND_MANY, (data) => data.documentsFind.data),
  history: createQueryFunction<
    TSingleDocumentHistory,
    TDocumentHistoryGetRequest,
    { historyDocumentGet: TSingleDocumentHistory }
  >(client, DOCUMENT_HISTORY, (data) => data.historyDocumentGet),
});
