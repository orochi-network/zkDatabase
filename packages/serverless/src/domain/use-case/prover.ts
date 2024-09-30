import { ClientSession } from 'mongodb';
import { Field } from 'o1js';

import { ModelMerkleTree, ModelQueueTask, TMerkleProof } from '@zkdb/storage';

import { ModelDocument, ModelDocumentMetadata } from '@model';

import { DocumentFields } from '../types';
import { buildSchema } from './schema';

// Prove the creation of a document
export async function proveCreateDocument(
  databaseName: string,
  collectionName: string,
  docId: string,
  document: DocumentFields,
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
      docId,
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
      docId,
    },
    { session }
  );

  return merkleTree.getWitness(BigInt(index), currDate, { session });
}

// Prove the update of a document
export async function proveUpdateDocument(
  databaseName: string,
  collectionName: string,
  docId: string,
  newDocument: DocumentFields,
  session?: ClientSession
) {
  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const oldDocument = await modelDocument.findOne({ docId }, session);

  if (!oldDocument) {
    throw new Error('Document does not exist');
  }

  const merkleTree = await ModelMerkleTree.load(databaseName);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const documentMetadata = await modelDocumentMetadata.findOne(
    {
      docId,
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
      docId,
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
  docId: string,
  session?: ClientSession
) {
  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const document = await modelDocument.findOne({ docId }, session);

  if (!document) {
    throw new Error('Document does not exist to be proved');
  }

  const merkleTree = await ModelMerkleTree.load(databaseName);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
  const documentMetadata = await modelDocumentMetadata.findOne(
    {
      docId,
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
      docId,
    },
    { session }
  );

  return merkleTree.getWitness(BigInt(documentMetadata.merkleIndex), currDate, {
    session,
  });
}
