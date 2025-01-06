import {
  EProofStatusDocument,
  ESequencer,
  TParamProveCreate,
  TParamProveDelete,
  TParamProveUpdate,
} from '@zkdb/common';
import {
  TCompoundSession,
  ModelMerkleTree,
  ModelQueueTask,
  ModelSequencer,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Field } from 'o1js';

import { ModelMetadataDocument } from '@model';
import { buildSchema } from './schema';

export class Prover {
  public static async create(
    proveCreateParam: TParamProveCreate,
    session: TCompoundSession
  ) {
    const { databaseName, docId, collectionName, document } = proveCreateParam;
    // Get document metadata
    const imMetadataDocument = new ModelMetadataDocument(databaseName);

    const metadataDocument = await imMetadataDocument.findOne(
      {
        docId,
      },
      { session: session.serverless }
    );

    if (!metadataDocument) {
      throw new Error(`No metadata found for docId ${docId}`);
    }

    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    // Building schema
    const schema = await buildSchema(
      databaseName,
      collectionName,
      document,
      session.serverless
    );

    const currDate = new Date();

    const index = metadataDocument.merkleIndex;

    const documentHash = schema.hash();

    const newRoot = await imMerkleTree.setLeaf(
      BigInt(index),
      documentHash,
      currDate,
      {
        session: session.serverless,
      }
    );

    const imSequencer = ModelSequencer.getInstance(databaseName);

    const operationNumber = await imSequencer.nextValue(
      ESequencer.Operation,
      session.serverless
    );

    await ModelQueueTask.getInstance().queueTask(
      {
        merkleIndex: BigInt(index),
        documentHash: documentHash.toString(),
        status: EProofStatusDocument.Queued,
        createdAt: currDate,
        updatedAt: currDate,
        databaseName,
        collectionName,
        docId,
        operationNumber,
        merkleRoot: newRoot.toString(),
      },
      { session: session.proofService }
    );

    return imMerkleTree.getMerkleProof(BigInt(index), currDate, {
      session: session.serverless,
    });
  }

  public static async update(
    proveUpdateParam: TParamProveUpdate,
    session: TCompoundSession
  ) {
    const { databaseName, collectionName, docId, newDocument } =
      proveUpdateParam;

    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    const imMetadataDocument = new ModelMetadataDocument(databaseName);
    const metadataDocument = await imMetadataDocument.findOne(
      {
        docId,
      },
      { session: session.serverless }
    );

    if (!metadataDocument) {
      throw new Error(`No metadata found for docId ${docId}`);
    }

    const schema = await buildSchema(
      databaseName,
      collectionName,
      newDocument,
      session.serverless
    );

    const currDate = new Date();
    const hash = schema.hash();
    const merkleIndex = BigInt(metadataDocument.merkleIndex);

    const newRoot = await imMerkleTree.setLeaf(merkleIndex, hash, currDate, {
      session: session.serverless,
    });

    const imSequencer = ModelSequencer.getInstance(databaseName);
    const operationNumber = await imSequencer.nextValue(
      ESequencer.Operation,
      session.serverless
    );

    await ModelQueueTask.getInstance().queueTask(
      {
        merkleIndex,
        documentHash: hash.toString(),
        status: EProofStatusDocument.Queued,
        createdAt: currDate,
        updatedAt: currDate,
        databaseName,
        collectionName,
        docId,
        operationNumber,
        merkleRoot: newRoot.toString(),
      },
      { session: session.proofService }
    );

    return imMerkleTree.getMerkleProof(merkleIndex, currDate, {
      session: session.serverless,
    });
  }

  public static async delete(
    proveDeleteParam: TParamProveDelete,
    session?: ClientSession
  ) {
    const { databaseName, collectionName, docId } = proveDeleteParam;

    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);
    const imMetadataDocument = new ModelMetadataDocument(databaseName);

    const metadataDocument = await imMetadataDocument.findOne(
      {
        docId,
      },
      { session }
    );

    if (!metadataDocument) {
      throw new Error(`No metadata found for docId ${docId}`);
    }

    const currDate = new Date();
    const merkleIndex = BigInt(metadataDocument.merkleIndex);

    const newRoot = await imMerkleTree.setLeaf(
      merkleIndex,
      Field(0),
      currDate,
      { session }
    );

    const imSequencer = ModelSequencer.getInstance(databaseName);

    const operationNumber = await imSequencer.nextValue(
      ESequencer.Operation,
      session
    );

    await ModelQueueTask.getInstance().queueTask(
      {
        merkleIndex,
        documentHash: Field(0).toString(),
        status: EProofStatusDocument.Queued,
        createdAt: currDate,
        updatedAt: currDate,
        databaseName,
        collectionName,
        docId,
        operationNumber,
        merkleRoot: newRoot.toString(),
      },
      { session }
    );

    return imMerkleTree.getMerkleProof(merkleIndex, currDate, {
      session,
    });
  }
}
