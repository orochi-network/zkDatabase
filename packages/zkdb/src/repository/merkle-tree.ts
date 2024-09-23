import { Field } from 'o1js';
import { MerkleWitness } from '../types/merkle-tree.js';
import { AppContainer } from '../container.js';

export async function getRoot(databaseName: string): Promise<Field> {
  const result = await AppContainer.getInstance().getApiClient().merkle.root({ databaseName });

  return Field(result.unwrap());
}

export async function getWitnessByDocumentId(
  databaseName: string,
  documentId: string
): Promise<MerkleWitness> {
  const result = await AppContainer.getInstance().getApiClient().merkle.witness({
    databaseName,
    docId: documentId,
  });

  return result.unwrap().map((node) => ({
    isLeft: node.isLeft,
    sibling: Field(node.sibling),
  }));
}
