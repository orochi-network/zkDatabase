import {
  getMerkleRoot,
  getWitnessByDocumentId as getWitnessByDocumentIdRequest,
} from '@zkdb/api';
import { Field } from 'o1js';
import { MerkleWitness } from '../types/merkle-tree.js';

export async function getRoot(databaseName: string): Promise<Field> {
  const result = await getMerkleRoot({ databaseName });

  return Field(result.unwrap());
}

export async function getWitnessByDocumentId(
  databaseName: string,
  documentId: string
): Promise<MerkleWitness> {
  const result = await getWitnessByDocumentIdRequest({
    databaseName,
    docId: documentId,
  });

  return result.unwrap().map((node) => ({
    isLeft: node.isLeft,
    sibling: Field(node.sibling),
  }));
}
