import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import {
  TDocumentHistoryPayload,
  TDocumentEncoded,
  TDocumentPayload,
  TMerkleWitness,
  TPermissions,
  TPagination,
  TPaginationResponse,
} from "./types";
import { TNetworkId } from "./types/network";

const DOCUMENT_DELETE = gql`
  mutation DocumentDrop(
    $networkId: NetworkId!
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
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $documentRecord: [DocumentRecordInput!]!
    $documentPermission: PermissionDetailInput
  ) {
    documentCreate(
      networkId: $networkId
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
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
    $documentRecord: [DocumentRecordInput!]!
  ) {
    documentUpdate(
      networkId: $networkId
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
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
  ) {
    documentFind(
      networkId: $networkId
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
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
    $pagination: PaginationInput
  ) {
    documentsFind(
      networkId: $networkId
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
      pagination: $pagination
    ) {
      totalSize
      offset
      data {
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

const DOCUMENT_HISTORY = gql`
  query HistoryDocumentGet(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $docId: String!
  ) {
    historyDocumentGet(
      networkId: $networkId
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
  delete: createMutateFunction<
    TMerkleWitness,
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      documentQuery: any;
    },
    { documentDrop: TMerkleWitness }
  >(client, DOCUMENT_DELETE, (data) => data.documentDrop),
  create: createMutateFunction<
    TMerkleWitness,
    {
      networkId: TNetworkId;
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
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      documentQuery: any;
      documentRecord: TDocumentEncoded;
    },
    { documentUpdate: TMerkleWitness }
  >(client, DOCUMENT_UPDATE, (data) => data.documentUpdate),
  findOne: createQueryFunction<
    TDocumentPayload,
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      documentQuery: any;
    },
    { documentFind: TDocumentPayload }
  >(client, DOCUMENT_FIND_ONE, (data) => data.documentFind),
  findMany: createQueryFunction<
    TDocumentPayload[],
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      documentQuery: any;
      pagination?: TPagination;
    },
    { documentsFind: TPaginationResponse<TDocumentPayload[]> }
  >(client, DOCUMENT_FIND_MANY, (data) => data.documentsFind.data),
  history: createQueryFunction<
    TDocumentHistoryPayload,
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      docId: string;
    },
    { historyDocumentGet: TDocumentHistoryPayload }
  >(client, DOCUMENT_HISTORY, (data) => data.historyDocumentGet),
});
