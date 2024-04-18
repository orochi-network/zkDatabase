import { mutate, query } from '../graphql-client.js';

type SchemaField = {
  name: string;
  kind: string;
  indexed?: boolean;
};

type PermissionSet = {
  system?: boolean;
  create?: boolean;
  read?: boolean;
  write?: boolean;
  delete?: boolean;
};

type Permissions = {
  permissionOwner: PermissionSet;
  permissionGroup: PermissionSet;
  permissionOthers: PermissionSet;
};

type SchemaFields = SchemaField[];

export interface CreateCollectionResponse {
  collectionCreate: boolean;
}

export interface ListCollectionResponse {
  collections: JSON;
}

export interface ListIndexesResponse {
  indexes: string[];
}

export interface ExistIndexResponse {
  existed: boolean;
}

export interface CreateIndexResponse {
  success: boolean;
}

export interface DropIndexResponse {
  success: boolean;
}

export const COLLECTION_LIST_QUERY = `
  query CollectionList($databaseName: String!) {
    collectionList(databaseName: $databaseName)
  }
`;

export const COLLECTION_CREATE_MUTATION = `
  mutation CollectionCreate(
    $databaseName: String!,
    $collectionName: String!,
    $groupName: String!,
    $schema: [SchemaFieldInput!]!,
    $permissions: PermissionDetailInput
  ) {
    collectionCreate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      groupName: $groupName,
      schema: $schema,
      permissions: $permissions
    )
  }
`;

export const INDEX_LIST_QUERY = `
  query IndexList($databaseName: String!, $collectionName: String!) {
    indexList(databaseName: $databaseName, collectionName: $collectionName)
  }
`;

export const INDEX_EXIST_QUERY = `
  query IndexExist($databaseName: String!, $collectionName: String!, $indexName: String!) {
    indexExist(databaseName: $databaseName, collectionName: $collectionName, indexName: $indexName)
  }
`;

export const INDEX_CREATE_MUTATION = `
  mutation IndexCreate($databaseName: String!, $collectionName: String!, $indexField: [String]!) {
    indexCreate(databaseName: $databaseName, collectionName: $collectionName, indexField: $indexField)
  }
`;

export const INDEX_DROP_MUTATION = `
  mutation IndexDrop($databaseName: String!, $collectionName: String!, $indexName: String!) {
    indexDrop(databaseName: $databaseName, collectionName: $collectionName, indexName: $indexName)
  }
`;

export const listIndexes = async (
  databaseName: string,
  collectionName: string
): Promise<ListIndexesResponse> => {
  const variables = { databaseName, collectionName };

  try {
    const response = await query<{ indexList: ListIndexesResponse }>(
      INDEX_LIST_QUERY,
      variables
    );
    const { indexList } = response;

    return {
      ...indexList,
    };
  } catch (error) {
    throw new Error('ListIndexes failed: ' + error);
  }
};

export const existIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<ExistIndexResponse> => {
  const variables = { databaseName, collectionName, indexName };

  try {
    const response = await query<{ indexExist: ExistIndexResponse }>(
      INDEX_LIST_QUERY,
      variables
    );
    const { indexExist } = response;

    return {
      ...indexExist,
    };
  } catch (error) {
    throw new Error('ExistIndexe failed: ' + error);
  }
};

export const createIndexes = async (
  databaseName: string,
  collectionName: string,
  indexNames: string[]
): Promise<CreateIndexResponse> => {
  const variables = { databaseName, collectionName, indexNames };

  try {
    const response = await query<{ indexCreate: CreateIndexResponse }>(
      INDEX_LIST_QUERY,
      variables
    );
    const { indexCreate } = response;

    return {
      ...indexCreate,
    };
  } catch (error) {
    throw new Error('CreateIndexes failed: ' + error);
  }
};

export const dropIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<DropIndexResponse> => {
  const variables = { databaseName, collectionName, indexName };

  try {
    const response = await query<{ indexDrop: DropIndexResponse }>(
      INDEX_LIST_QUERY,
      variables
    );
    const { indexDrop } = response;

    return {
      ...indexDrop,
    };
  } catch (error) {
    throw new Error('DropIndex failed: ' + error);
  }
};

export const createCollection = async (
  databaseName: string,
  collectionName: string,
  groupName: string,
  schema: SchemaFields,
  permissions?: Permissions
): Promise<CreateCollectionResponse> => {
  const variables = { databaseName, collectionName, groupName, schema, permissions };
  return mutate<CreateCollectionResponse>(
    COLLECTION_CREATE_MUTATION,
    variables
  );
};

export const listCollections = async (
  databaseName: string
): Promise<ListCollectionResponse> => {
  const variables = { databaseName };
  return query<ListCollectionResponse>(COLLECTION_LIST_QUERY, variables);
};
