import client from '../graphql-client.js';

export interface GetMerkleNodeResponse {
  node: JSON;
}

export interface GetMerkleWitnessResponse {
  witness: JSON;
}

export const GET_NODE_QUERY = `
  query GetNode($databaseName: String!, $level: Int!, $index: String!) {
    getNode(databaseName: $databaseName, level: $level, index: $index)
  }
`;

export const GET_WITNESS_QUERY = `
  query GetWitness($databaseName: String!, $root: String!, $index: String!) {
    getWitness(databaseName: $databaseName, root: $root, index: $index) {
      isLeft
      sibling
    }
  }
`;

export const getNode = async (
  databaseName: string,
  level: number,
  index: string
): Promise<GetMerkleNodeResponse> => {
  const variables = { databaseName, level, index };
  return client.request<GetMerkleNodeResponse>(GET_NODE_QUERY, variables);
};

export const getWitness = async (
  databaseName: string,
  root: string,
  index: string
): Promise<GetMerkleWitnessResponse> => {
  const variables = { databaseName, root, index };
  return client.request<GetMerkleWitnessResponse>(GET_WITNESS_QUERY, variables);
};
