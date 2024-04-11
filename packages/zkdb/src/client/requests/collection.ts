import client from '../graphql-client.js';

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

export const COLLECTION_LIST_QUERY = `
  query CollectionList($databaseName: String!) {
    collectionList(databaseName: $databaseName)
  }
`;

export const COLLECTION_CREATE_MUTATION = `
  mutation CollectionCreate(
    $databaseName: String!,
    $collectionName: String!,
    $schema: [SchemaFieldInput!]!,
    $permissions: PermissionDetailInput
  ) {
    collectionCreate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      schema: $schema,
      permissions: $permissions
    )
  }
`;

export const createCollection = async (
  databaseName: string,
  collectionName: string,
  schema: SchemaFields,
  permissions?: Permissions
): Promise<CreateCollectionResponse> => {
  const variables = { databaseName, collectionName, schema, permissions };
  return client.request<CreateCollectionResponse>(
    COLLECTION_CREATE_MUTATION,
    variables
  );
};

export const listCollections = async (
  databaseName: string
): Promise<ListCollectionResponse> => {
  const variables = { databaseName };
  return client.request<ListCollectionResponse>(
    COLLECTION_LIST_QUERY,
    variables
  );
};
