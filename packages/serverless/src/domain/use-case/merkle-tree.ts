import { ModelMerkleTree, TMerkleProof } from '@zkdb/storage';
import { ClientSession, ObjectId } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata';

// eslint-disable-next-line import/prefer-default-export
export async function getWitnessByDocumentId(
  databaseName: string,
  documentId: ObjectId,
  session?: ClientSession
): Promise<TMerkleProof[]> {
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  const docMetadata = await modelDocumentMetadata.findOne({
    docId: documentId,
  });

  if (!docMetadata) {
    throw Error(`Metadata has not been found`);
  }

  const merkleTree = ModelMerkleTree.getInstance(databaseName);

  return merkleTree.getWitness(BigInt(docMetadata.merkleIndex), new Date(), {
    session,
  });
}
