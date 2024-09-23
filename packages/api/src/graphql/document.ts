import pkg, { ApolloClient } from "@apollo/client";
import { createMutateFunction, createQueryFunction } from "./common.js";
import { TDocumentHistoryPayload } from "./types/document-history.js";
import { TDocumentEncoded, TDocumentPayload } from "./types/document.js";
import { TMerkleWitness } from "./types/merkle-tree.js";
import { TPermissions } from "./types/ownership.js";
import { TPagination } from "./types/pagination.js";
const { gql } = pkg;

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
  mutation DocumentCreate(
    $databaseName: String!
    $collectionName: String!
    $documentRecord: [DocumentRecordInput!]!
    $documentPermission: PermissionDetailInput
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
      fields {
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
      docId
      fields {
        name
        kind
        value
      }
      createdAt
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

export const document = <T>(client: ApolloClient<T>) => ({
  delete: createMutateFunction<
    TMerkleWitness,
    { databaseName: string; collectionName: string; documentQuery: JSON },
    { documentDrop: TMerkleWitness }
  >(client, DOCUMENT_DELETE, (data) => data.documentDrop),
  create: createMutateFunction<
    TDocumentEncoded,
    {
      databaseName: string;
      collectionName: string;
      documentRecord: TDocumentEncoded;
      documentPermission: TPermissions;
    },
    { documentCreate: TMerkleWitness }
  >(client, DOCUMENT_CREATE, (data) => data.documentCreate),
  update: createMutateFunction<
    TMerkleWitness,
    {
      databaseName: string;
      collectionName: string;
      documentQuery: any;
      documentRecord: TDocumentEncoded;
    },
    { documentUpdate: TMerkleWitness }
  >(client, DOCUMENT_UPDATE, (data) => data.documentUpdate),
  findOne: createQueryFunction<
    TDocumentPayload,
    { databaseName: string; collectionName: string; documentQuery: any },
    { documentFind: TDocumentPayload }
  >(client, DOCUMENT_FIND_ONE, (data) => data.documentFind),
  findMany: createQueryFunction<
    TDocumentPayload,
    {
      databaseName: string;
      collectionName: string;
      documentQuery: any;
      pagination?: TPagination;
    },
    { documentsFind: TDocumentPayload }
  >(client, DOCUMENT_FIND_MANY, (data) => data.documentsFind),
  history: createQueryFunction<
    TDocumentHistoryPayload,
    { databaseName: string; collectionName: string; docId: string },
    { historyDocumentGet: TDocumentHistoryPayload }
  >(client, DOCUMENT_HISTORY, (data) => data.historyDocumentGet),
});
