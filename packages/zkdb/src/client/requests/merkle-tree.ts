import { query } from '../graphql-client.js';
import { MerkleWitness } from '../types/merkle-tree.js';

export interface GetMerkleNodeResponse {
  node: string;
}
export interface GetMerkleWitnessResponse {
  witness: MerkleWitness;
}

export const GET_ROOT_QUERY = `
  query GetRoot($databaseName: String!) {
    getRoot(databaseName: $databaseName)
  }
`;

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

export const GET_WITNESS_BY_DOCUMENT_QUERY = `
  query GetWitness($databaseName: String!, $docId: String!) {
    getWitnessByDocument(databaseName: $databaseName, docId: $docId) {
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
  return query<GetMerkleNodeResponse>(GET_NODE_QUERY, variables);
};

export const getRoot = async (
  databaseName: string
): Promise<GetMerkleNodeResponse> => {
  const variables = {
    databaseName
  };
  try {
    const response = await query<{ getRoot: GetMerkleNodeResponse }>(
      GET_ROOT_QUERY,
      variables
    );
    const { getRoot } = response;

    return {
      node: getRoot as any
    };
  } catch (error) {
    throw new Error('getRoot failed: ' + error);
  }
};


export const getWitness = async (
  databaseName: string,
  root: string,
  index: string
): Promise<GetMerkleWitnessResponse> => {
  const variables = { databaseName, root, index };
  return query<GetMerkleWitnessResponse>(GET_WITNESS_QUERY, variables);
};

export const getWitnessByDocumentId = async (
  databaseName: string,
  docId: string
) : Promise<GetMerkleWitnessResponse> => {
  const variables = { databaseName, docId };
  try {
    const response = await query<{ getWitnessByDocument: GetMerkleWitnessResponse }>(
      GET_WITNESS_BY_DOCUMENT_QUERY,
      variables
    );
    const { getWitnessByDocument } = response;

    return {
      witness: getWitnessByDocument as any
    };
  } catch (error) {
    throw new Error('getRoot failed: ' + error);
  }
};