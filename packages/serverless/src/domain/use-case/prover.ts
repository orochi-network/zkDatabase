import { ESequencer } from '@zkdb/common';
import {
  TCompoundSession,
  ModelSequencer,
  ModelGenericQueue,
  TDocumentQueuedData,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { Field } from 'o1js';

import { ModelMetadataDocument } from '@model';
import { DocumentSchema, TValidatedDocument } from './document-schema';

// For prover param use-case
export type TParamProve = {
  databaseName: string;
  collectionName: string;
  docId: string;
};

export type TParamProveCreate = TParamProve & {
  document: TValidatedDocument;
};

export type TParamProveUpdate = TParamProve & {
  newDocument: TValidatedDocument;
};

export type TParamProveDelete = TParamProve;

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

    // Building schema
    const schema = DocumentSchema.buildSchema(document);

    const index = metadataDocument.merkleIndex;

    const hash = schema.hash();

    const imSequencer = ModelSequencer.getInstance(databaseName);

    const operationNumber = await imSequencer.nextValue(
      ESequencer.Operation,
      session.serverless
    );

    await ModelGenericQueue.getInstance<TDocumentQueuedData>(
      zkDatabaseConstant.globalCollection.documentQueue
    ).queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(index),
          updatedDocumentHash: hash.toString(),
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }

  public static async update(
    proveUpdateParam: TParamProveUpdate,
    session: TCompoundSession
  ) {
    const { databaseName, collectionName, docId, newDocument } =
      proveUpdateParam;

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

    const schema = DocumentSchema.buildSchema(newDocument);

    const hash = schema.hash();

    const imSequencer = ModelSequencer.getInstance(databaseName);
    const operationNumber = await imSequencer.nextValue(
      ESequencer.Operation,
      session.serverless
    );

    await ModelGenericQueue.getInstance<TDocumentQueuedData>(
      zkDatabaseConstant.globalCollection.documentQueue
    ).queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(metadataDocument.merkleIndex),
          updatedDocumentHash: hash.toString(),
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }

  public static async delete(
    proveDeleteParam: TParamProveDelete,
    session: TCompoundSession
  ) {
    const { databaseName, collectionName, docId } = proveDeleteParam;

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

    const imSequencer = ModelSequencer.getInstance(databaseName);

    const operationNumber = await imSequencer.nextValue(
      ESequencer.Operation,
      session.serverless
    );

    await ModelGenericQueue.getInstance<TDocumentQueuedData>(
      zkDatabaseConstant.globalCollection.documentQueue
    ).queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(metadataDocument.merkleIndex),
          updatedDocumentHash: Field(0).toString(),
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }
}
