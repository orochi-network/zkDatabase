import {
  getMerkleRoot,
  getWitnessByDocumentId as getWitnessByDocumentIdRequest,
} from '@zkdb/api';
import { Field } from 'o1js';
import { MerkleWitness } from '../types/merkle-tree.js';

export async function getRoot(databaseName: string): Promise<Field> {
  const result = await getMerkleRoot(databaseName);

  if (result.isOne()) {
    return Field(result.unwrapObject());
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function getWitnessByDocumentId(
  databaseName: string,
  documentId: string
): Promise<MerkleWitness> {
  const result = await getWitnessByDocumentIdRequest(databaseName, documentId);
  if (result.isOne()) {
    return result.unwrapObject().map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}
