import { ObjectId } from 'mongodb';
import { Field } from 'o1js';

import {
  TMerkleProof,
  ModelDbSetting,
  ModelMerkleTree,
  ModelQueueTask,
} from '@zkdb/storage';

import ModelDocumentMetadata from '../../model/database/document-metadata';
import ModelDocument from '../../model/abstract/document';

import { Document } from '../types/document';
import { buildSchema } from './schema';

// Helper function to set the Merkle tree height
async function setMerkleTreeHeight(
  merkleTree: ModelMerkleTree,
  databaseName: string
) {
  const height = await ModelDbSetting.getInstance(databaseName).getHeight();
  if (!height) {
    throw new Error('The Merkle tree height is null');
  }
  merkleTree.setHeight(height);
}

// Prove the creation of a document
export async function proveCreateDocument(
  databaseName: string,
  collectionName: string,
  document: Document
): Promise<TMerkleProof[]> {
  const merkleTree = ModelMerkleTree.getInstance(databaseName);
  await setMerkleTreeHeight(merkleTree, databaseName);

  const schema = await buildSchema(databaseName, collectionName, document);
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const index = (await modelDocumentMetadata.getMaxIndex()) + 1;
  const currDate = new Date();

  const hash = schema.hash();
  await merkleTree.setLeaf(BigInt(index), hash, currDate);

  await ModelQueueTask.getInstance().createTask({
    merkleIndex: BigInt(index),
    hash: hash.toString(),
    createdAt: currDate,
    database: databaseName,
    collection: collectionName,
  });

  return merkleTree.getWitness(BigInt(index), currDate);
}

// Prove the update of a document
export async function proveUpdateDocument(
  databaseName: string,
  collectionName: string,
  documentId: ObjectId,
  newDocument: Document
) {
  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const oldDocument = await modelDocument.findOne({ _id: documentId });

  if (!oldDocument) {
    throw new Error('Document does not exist');
  }

  const merkleTree = ModelMerkleTree.getInstance(databaseName);
  await setMerkleTreeHeight(merkleTree, databaseName);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const documentMetadata = await modelDocumentMetadata.findOne({
    docId: oldDocument._id,
  });

  if (!documentMetadata) {
    throw new Error('Document metadata is empty');
  }

  const schema = await buildSchema(databaseName, collectionName, newDocument);
  const currDate = new Date();
  const hash = schema.hash();

  await merkleTree.setLeaf(
    BigInt(documentMetadata.merkleIndex),
    hash,
    currDate
  );

  await ModelQueueTask.getInstance().createTask({
    merkleIndex: BigInt(documentMetadata.merkleIndex),
    hash: hash.toString(),
    createdAt: currDate,
    database: databaseName,
    collection: collectionName,
  });

  return merkleTree.getWitness(BigInt(documentMetadata.merkleIndex), currDate);
}

// Prove the deletion of a document
export async function proveDeleteDocument(
  databaseName: string,
  collectionName: string,
  documentId: ObjectId
) {
  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const document = await modelDocument.findOne({ _id: documentId });

  if (!document) {
    throw new Error('Document does not exist to be proved');
  }

  const merkleTree = ModelMerkleTree.getInstance(databaseName);
  await setMerkleTreeHeight(merkleTree, databaseName);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const documentMetadata = await modelDocumentMetadata.findOne({
    docId: documentId,
  });

  if (!documentMetadata) {
    throw new Error('Document metadata is empty');
  }
  
  const currDate = new Date();
  await merkleTree.setLeaf(
    BigInt(documentMetadata.merkleIndex),
    Field(0),
    currDate
  );

  await ModelQueueTask.getInstance().createTask({
    merkleIndex: BigInt(documentMetadata.merkleIndex),
    hash: Field(0).toString(),
    createdAt: currDate,
    database: databaseName,
    collection: collectionName,
  });

  return merkleTree.getWitness(BigInt(documentMetadata.merkleIndex), currDate);
}
