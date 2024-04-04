// client/api.ts
import client from './graphql-client.js';
import {
  CREATE_DATABASE,
  GET_DATABASE_STATUS,
  LIST_DATABASE,
  DatabaseListResult,
  DatabaseStatusResult,
} from './requests/database.js';

export const getDbList = async (): Promise<DatabaseListResult> => {
  const data = await client.request<DatabaseListResult>(LIST_DATABASE);
  return data;
};

export const getDbStats = async (
  databaseName: string
): Promise<DatabaseStatusResult> => {
  const variables = { databaseName };
  const data = await client.request<DatabaseStatusResult>(
    GET_DATABASE_STATUS,
    variables
  );
  return data;
};

export const dbCreate = async (
  databaseName: string,
  merkleHeight: number
): Promise<boolean> => {
  const variables = { databaseName, merkleHeight };
  const data = await client.request<{ dbCreate: boolean }>(
    CREATE_DATABASE,
    variables
  );
  return data.dbCreate;
};
