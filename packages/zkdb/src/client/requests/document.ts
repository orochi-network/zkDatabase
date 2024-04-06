import client from '../graphql-client.js';

export interface FindDocumentResponse {
  document: JSON;
}

export interface CreateDocumentResponse {
  created: boolean;
}

export interface UpdateDocumentResponse {
  updated: boolean;
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
    $documentRecord: JSON!,
    $documentPermission: PermissionDetailInput
  ) {
    documentCreate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentRecord: $documentRecord,
      documentPermission: $documentPermission
    )
  }
`;

export const DOCUMENT_UPDATE_MUTATION = `
  mutation DocumentUpdate(
    $databaseName: String!,
    $collectionName: String!,
    $documentQuery: JSON!,
    $documentRecord: JSON!
  ) {
    documentUpdate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentQuery: $documentQuery,
      documentRecord: $documentRecord
    )
  }
`;

export const findDocument = async (
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
  documentRecord: any,
  documentPermission: any
): Promise<any> => {
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