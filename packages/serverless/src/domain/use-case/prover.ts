import { ClientSession } from 'mongodb';
import { Field } from 'o1js';

import {
  TMerkleProof,
  ModelMerkleTree,
  ModelQueueTask,
  ModelSequencer,
  CompoundSession,
} from '@zkdb/storage';

import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelDocument from '../../model/abstract/document.js';

import { DocumentFields } from '../types/document.js';
import { buildSchema } from './schema.js';

// Prove the creation of a document
export async function proveCreateDocument(
  databaseName: string,
  collectionName: string,
  docId: string,
  document: DocumentFields,
  compoundSession?: CompoundSession
): Promise<TMerkleProof[]> {
  const merkleTree = await ModelMerkleTree.load(databaseName);

  const schema = await buildSchema(
    databaseName,
    collectionName,
    document,
    compoundSession?.sessionService
  );
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  const documentMetadata = await modelDocumentMetadata.findOne(
    {
      docId,
    },
    { session: compoundSession?.sessionService }
  );

  if (!documentMetadata) {
    throw Error('Metadata is missed');
  }

  const index = documentMetadata.merkleIndex;

  const currDate = new Date();

  const hash = schema.hash();
  const newRoot = await merkleTree.setLeaf(BigInt(index), hash, currDate, {
    session: compoundSession?.sessionService,
  });

  const sequencer = ModelSequencer.getInstance(databaseName);
  const operationNumber = await sequencer.getNextValue(
    'operation',
    compoundSession?.sessionService
  );

  await ModelQueueTask.getInstance().queueTask(
    {
      merkleIndex: BigInt(index),
      hash: hash.toString(),
      status: 'queued',
      createdAt: currDate,
      database: databaseName,
      collection: collectionName,
      docId,
      operationNumber,
      merkleRoot: newRoot.toString(),
    },
    { session: compoundSession?.sessionProof }
  );

  return merkleTree.getWitness(BigInt(index), currDate, {
    session: compoundSession?.sessionService,
  });
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

  const newRoot = await merkleTree.setLeaf(
    BigInt(documentMetadata.merkleIndex),
    hash,
    currDate,
    { session }
  );

  const sequencer = ModelSequencer.getInstance(databaseName);
  const operationNumber = await sequencer.getNextValue('operation', session);

  await ModelQueueTask.getInstance().queueTask(
    {
      merkleIndex: BigInt(documentMetadata.merkleIndex),
      hash: hash.toString(),
      status: 'queued',
      createdAt: currDate,
      database: databaseName,
      collection: collectionName,
      docId,
      operationNumber,
      merkleRoot: newRoot.toString(),
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
  const newRoot = await merkleTree.setLeaf(
    BigInt(documentMetadata.merkleIndex),
    Field(0),
    currDate,
    { session }
  );

  const sequencer = ModelSequencer.getInstance(databaseName);
  const operationNumber = await sequencer.getNextValue('operation', session);

  await ModelQueueTask.getInstance().queueTask(
    {
      merkleIndex: BigInt(documentMetadata.merkleIndex),
      hash: Field(0).toString(),
      status: 'queued',
      createdAt: currDate,
      database: databaseName,
      collection: collectionName,
      docId,
      operationNumber,
      merkleRoot: newRoot.toString(),
    },
    { session }
  );

  return merkleTree.getWitness(BigInt(documentMetadata.merkleIndex), currDate, {
    session,
  });
}
