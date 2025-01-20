import { EDocumentOperation } from '@zkdb/common';
import { TCompoundSession, ModelGenericQueue, EQueueType } from '@zkdb/storage';

import { ModelMetadataDocument } from '@model';
import { ObjectId } from 'mongodb';
import { DocumentSchema, TValidatedDocument } from './document-schema.js';

// For prover param use-case
export type TParamProve = {
  databaseName: string;
  collectionName: string;
  docId: string;
};

export type TParamProveCreate = TParamProve & {
  document: TValidatedDocument;
  documentObjectId: ObjectId;
};

export type TParamProveUpdate = TParamProve & {
  newDocument: TValidatedDocument;
  newDocumentObjectId: ObjectId;
  oldDocumentObjectId: ObjectId;
};

export type TParamProveDelete = TParamProve & {
  oldDocumentObjectId: ObjectId;
};

export class Prover {
  public static async create(
    proveCreateParam: TParamProveCreate,
    operationNumber: bigint,
    session: TCompoundSession
  ) {
    const { databaseName, docId, collectionName, document, documentObjectId } =
      proveCreateParam;
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

    const documentHash = schema.hash();

    const imModelGenericQueue = await ModelGenericQueue.getInstance(
      EQueueType.DocumentQueue,
      session.proofService
    );

    await imModelGenericQueue.queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(index),
          newDocumentHash: documentHash.toString(),
          operationKind: EDocumentOperation.Create,
          docId,
          documentObjectIdPrevious: null,
          documentObjectIdCurrent: documentObjectId.toString(),
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }

  public static async update(
    proveUpdateParam: TParamProveUpdate,
    operationNumber: bigint,
    session: TCompoundSession
  ) {
    const {
      databaseName,
      collectionName,
      docId,
      newDocument,
      oldDocumentObjectId,
      newDocumentObjectId,
    } = proveUpdateParam;

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

    const imModelGenericQueue = await ModelGenericQueue.getInstance(
      EQueueType.DocumentQueue,
      session.proofService
    );

    await imModelGenericQueue.queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(metadataDocument.merkleIndex),
          newDocumentHash: hash.toString(),
          operationKind: EDocumentOperation.Update,
          docId,
          documentObjectIdPrevious: oldDocumentObjectId.toString(),
          documentObjectIdCurrent: newDocumentObjectId.toString(),
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }

  public static async delete(
    proveDeleteParam: TParamProveDelete,
    operationNumber: bigint,
    session: TCompoundSession
  ) {
    const { databaseName, collectionName, docId, oldDocumentObjectId } =
      proveDeleteParam;

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

    const imModelGenericQueue = await ModelGenericQueue.getInstance(
      EQueueType.DocumentQueue,
      session.proofService
    );

    await imModelGenericQueue.queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(metadataDocument.merkleIndex),
          newDocumentHash: undefined,
          operationKind: EDocumentOperation.Drop,
          documentObjectIdPrevious: oldDocumentObjectId.toString(),
          documentObjectIdCurrent: null,
          docId,
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }
}
