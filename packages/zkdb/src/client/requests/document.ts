import { DocumentEncoded } from '../../core/schema.js';
import client from '../graphql-client.js';
import { MerkleWitness } from '../types/merkle-tree.js';

export interface PermissionRecord {
  system?: boolean;
  create?: boolean;
  read?: boolean;
  write?: boolean;
  delete?: boolean;
}

export interface PermissionDetail {
  permissionOwner?: PermissionRecord;
  permissionGroup?: PermissionRecord;
  permissionOthers?: PermissionRecord;
}

export interface FindDocumentResponse {
  findDocument: DocumentEncoded;
}

export interface CreateDocumentResponse {
  documentCreate: MerkleWitness;
}

export interface UpdateDocumentResponse {
  documentUpdate: MerkleWitness;
}

export const DOCUMENT_FIND_QUERY = `
  query DocumentFind($databaseName: String!, $collectionName: String!, $documentQuery: JSON!) {
    documentFind(databaseName: $databaseName, collectionName: $collectionName, documentQuery: $documentQuery)
  }
`; 

export const DOCUMENT_CREATE_MUTATION = `
  mutation DocumentCreate(
    $databaseName: String!,
    $collectionName: String!,
    $documentRecord: [DocumentInput!]!,
    $documentPermission: PermissionDetailInput
  ) {
    documentCreate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentRecord: $documentRecord,
      documentPermission: $documentPermission
    ) {
      isLeft
      sibling
    }
  }
`;

export const DOCUMENT_UPDATE_MUTATION = `
  mutation DocumentUpdate(
    $databaseName: String!,
    $collectionName: String!,
    $documentQuery: JSON,
    $documentRecord: [DocumentInput!]!
  ) {
    documentUpdate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentQuery: $documentQuery,
      documentRecord: $documentRecord
    ) {
      isLeft
      sibling
    }
  }
`;

export const readDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: any
): Promise<FindDocumentResponse> => {
  const variables = { databaseName, collectionName, documentQuery };
  return client.request<FindDocumentResponse>(
    DOCUMENT_FIND_QUERY,
    variables
  );
};

export const createDocument = async (
  databaseName: string,
  collectionName: string,
  documentRecord: DocumentEncoded,
  documentPermission: PermissionDetail
): Promise<CreateDocumentResponse> => {
  const variables = {
    databaseName,
    collectionName,
    documentRecord,
    documentPermission,
  };
  return client.request<CreateDocumentResponse>(
    DOCUMENT_CREATE_MUTATION,
    variables
  );
};

export const updateDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: any,
  documentRecord: any
): Promise<UpdateDocumentResponse> => {
  const variables = {
    databaseName,
    collectionName,
    documentQuery,
    documentRecord,
  };
  return client.request<UpdateDocumentResponse>(
    DOCUMENT_UPDATE_MUTATION,
    variables
  );
};