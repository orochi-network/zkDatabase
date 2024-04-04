export interface DatabaseListResult {
  dbList: JSON;
}

export interface DatabaseStatusResult {
  dbStats: JSON;
}

export const LIST_DATABASE = `
  query GetDbList {
    dbList
  }
`;

export const GET_DATABASE_STATUS = `
  query GetDbStats($databaseName: String!) {
    dbStats(databaseName: $databaseName)
`;

export const CREATE_DATABASE = `
  mutation DbCreate($databaseName: String!, $merkleHeight: Int!) {
    dbCreate(databaseName: $databaseName, merkleHeight: $merkleHeight)
  }
`;