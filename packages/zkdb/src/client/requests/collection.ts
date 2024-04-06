import client from '../graphql-client.js';

export interface CreateCollectionResponse {
  created: boolean;
}

export interface ListCollectionResponse {
  collections: JSON;
}

export const COLLECTION_LIST_QUERY = `
  query CollectionList($databaseName: String!) {
    collectionList(databaseName: $databaseName)
  }
`;

export const COLLECTION_CREATE_MUTATION = `
  mutation CollectionCreate($databaseName: String!, $collectionName: String!, $indexField: [String]) {
    collectionCreate(databaseName: $databaseName, collectionName: $collectionName, indexField: $indexField)
  }
`;

export const createCollection = async (
  databaseName: string,
  collectionName: string
): Promise<CreateCollectionResponse> => {
  const variables = { databaseName, collectionName };
  return client.request<CreateCollectionResponse>(
    COLLECTION_CREATE_MUTATION,
    variables
  );
}

export const listCollections = async (
  databaseName: string
): Promise<ListCollectionResponse> => {
  const variables = { databaseName };
  return client.request<ListCollectionResponse>(
    COLLECTION_LIST_QUERY,
    variables
  );
}