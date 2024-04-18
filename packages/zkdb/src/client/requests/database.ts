import {query, mutate} from '../graphql-client.js';

export interface ListDatabaseResponse {
  databases: JSON;
}

export interface GetDatabaseStatusResponse {
  status: JSON;
}

export interface CreateDatabaseResponse {
  dbCreate: boolean
}

export const DATABASE_LIST_QUERY = `
  query GetDbList {
    dbList
  }
`;

export const DATABASE_GET_STATUS_QUERY = `
  query GetDbStats($databaseName: String!) {
    dbStats(databaseName: $databaseName)
  }
`;

export const DATABASE_CREATE_MUTATION = `
  mutation DbCreate($databaseName: String!, $merkleHeight: Int!) {
    dbCreate(databaseName: $databaseName, merkleHeight: $merkleHeight)
  }
`;

export const listDatabases = async (): Promise<ListDatabaseResponse> => {
  return query<ListDatabaseResponse>(DATABASE_LIST_QUERY, {});
};

export const getDatabaseStatus = async (
  databaseName: string
): Promise<GetDatabaseStatusResponse> => {
  const variables = { databaseName };
  const data = await query<GetDatabaseStatusResponse>(
    DATABASE_GET_STATUS_QUERY,
    variables
  );
  return data;
};

export const createDatabase = async (
  databaseName: string,
  merkleHeight: number
): Promise<CreateDatabaseResponse> => {
  const variables = { databaseName, merkleHeight };
  return mutate<CreateDatabaseResponse>(
    DATABASE_CREATE_MUTATION,
    variables
  );
};