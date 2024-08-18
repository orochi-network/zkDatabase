import {
  getMerkleRoot,
  getWitnessByDocumentId as getWitnessByDocumentIdRequest,
} from '@zkdb/api';
import { Field } from 'o1js';
import { MerkleWitness } from '../types/merkle-tree.js';

export async function getRoot(databaseName: string): Promise<Field> {
  const result = await getMerkleRoot(databaseName);

  if (result.type === 'success') {
    return Field(result.data);
  } else {
    throw Error(result.message);
  }
}

export async function getWitnessByDocumentId(
  databaseName: string,
  documentId: string
): Promise<MerkleWitness> {
  const result = await getWitnessByDocumentIdRequest(databaseName, documentId);
  if (result.type === 'success') {
    return result.data.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    throw Error(result.message);
  }
}
