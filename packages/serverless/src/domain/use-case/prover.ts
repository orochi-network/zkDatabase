import { ClientSession, ObjectId } from 'mongodb';
import { Field } from 'o1js';

import {
  TMerkleProof,
  ModelDbSetting,
  ModelMerkleTree,
  ModelQueueTask,
} from '@zkdb/storage';

import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelDocument from '../../model/abstract/document.js';

import { Document } from '../types/document.js';
import { buildSchema } from './schema.js';

// Prove the creation of a document
export async function proveCreateDocument(
  databaseName: string,
  collectionName: string,
  documentId: ObjectId,
  document: Document,
  session?: ClientSession
): Promise<TMerkleProof[]> {
  const merkleTree = await ModelMerkleTree.load(databaseName);

  const schema = await buildSchema(
    databaseName,
    collectionName,
    document,
    session
  );
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  const documentMetadata = await modelDocumentMetadata.findOne(
    {
      docId: documentId,
    },
    { session }
  );

  if (!documentMetadata) {
    throw Error('Metadata is missed');
  }

  const index = documentMetadata.merkleIndex;

  const currDate = new Date();

  const hash = schema.hash();
  await merkleTree.setLeaf(BigInt(index), hash, currDate, { session });

  await ModelQueueTask.getInstance().queueTask(
    {
      merkleIndex: BigInt(index),
      hash: hash.toString(),
      status: 'queued',
      createdAt: currDate,
      database: databaseName,
      collection: collectionName,
      docId: documentId.toString()
    },
    { session }
  );

  return merkleTree.getWitness(BigInt(index), currDate, { session });
}

// Prove the update of a document
export async function proveUpdateDocument(
  databaseName: string,
  collectionName: string,
  documentId: ObjectId,
  newDocument: Document,
  session?: ClientSession
) {
  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const oldDocument = await modelDocument.findOne({ _id: documentId }, session);

  if (!oldDocument) {
    throw new Error('Document does not exist');
  }

  const merkleTree = await ModelMerkleTree.load(databaseName);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const documentMetadata = await modelDocumentMetadata.findOne(
    {
      docId: oldDocument._id,
    },
    { session }
  );

  if (!documentMetadata) {
    throw new Error('Document metadata is empty');
  }

  const schema = await buildSchema(
    databaseName,
    collectionName,
    newDocument,
    session
  );
  const currDate = new Date();
  const hash = schema.hash();

  await merkleTree.setLeaf(
    BigInt(documentMetadata.merkleIndex),
    hash,
    currDate,
    { session }
  );

  await ModelQueueTask.getInstance().queueTask(
    {
      merkleIndex: BigInt(documentMetadata.merkleIndex),
      hash: hash.toString(),
      status: 'queued',
      createdAt: currDate,
      database: databaseName,
      collection: collectionName,
      docId: documentId.toString()
    },
    { session }
  );

  return merkleTree.getWitness(BigInt(documentMetadata.merkleIndex), currDate, {
    session,
  });
}

// Prove the deletion of a document
export async function proveDeleteDocument(
  databaseName: string,
  collectionName: string,
  documentId: ObjectId,
  session?: ClientSession
) {
  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const document = await modelDocument.findOne({ _id: documentId }, session);

  if (!document) {
    throw new Error('Document does not exist to be proved');
  }

  const merkleTree = await ModelMerkleTree.load(databaseName);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const documentMetadata = await modelDocumentMetadata.findOne(
    {
      docId: documentId,
    },
    { session }
  );

  if (!documentMetadata) {
    throw new Error('Document metadata is empty');
  }

  const currDate = new Date();
  await merkleTree.setLeaf(
    BigInt(documentMetadata.merkleIndex),
    Field(0),
    currDate,
    { session }
  );

  await ModelQueueTask.getInstance().queueTask(
    {
      merkleIndex: BigInt(documentMetadata.merkleIndex),
      hash: Field(0).toString(),
      status: 'queued',
      createdAt: currDate,
      database: databaseName,
      collection: collectionName,
      docId: documentId.toString()
    },
    { session }
  );

  return merkleTree.getWitness(BigInt(documentMetadata.merkleIndex), currDate, {
    session,
  });
}
