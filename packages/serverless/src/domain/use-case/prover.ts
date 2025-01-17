import {
  EDocumentOperation,
  ESequencer,
  TDocumentQueuedData,
} from '@zkdb/common';
import {
  TCompoundSession,
  ModelSequencer,
  ModelGenericQueue,
  zkDatabaseConstant,
} from '@zkdb/storage';

import { ModelMetadataDocument } from '@model';
import { ObjectId } from 'mongodb';
import { DocumentSchema, TValidatedDocument } from './document-schema';

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

    const imSequencer = await ModelSequencer.getInstance(
      databaseName,
      session.serverless
    );

    const operationNumber = await imSequencer.nextValue(
      ESequencer.DataOperation,
      session.serverless
    );

    const imModelGenericQueue =
      await ModelGenericQueue.getInstance<TDocumentQueuedData>(
        zkDatabaseConstant.globalCollection.documentQueue,
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
          previousDocumentObjectId: null,
          currentDocumentObjectId: documentObjectId.toString(),
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

    const imSequencer = await ModelSequencer.getInstance(
      databaseName,
      session.serverless
    );
    const operationNumber = await imSequencer.nextValue(
      ESequencer.DataOperation,
      session.serverless
    );

    const imModelGenericQueue =
      await ModelGenericQueue.getInstance<TDocumentQueuedData>(
        zkDatabaseConstant.globalCollection.documentQueue,
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
          previousDocumentObjectId: oldDocumentObjectId.toString(),
          currentDocumentObjectId: newDocumentObjectId.toString(),
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

    const imSequencer = await ModelSequencer.getInstance(
      databaseName,
      session.serverless
    );

    const operationNumber = await imSequencer.nextValue(
      ESequencer.DataOperation,
      session.serverless
    );

    const imModelGenericQueue =
      await ModelGenericQueue.getInstance<TDocumentQueuedData>(
        zkDatabaseConstant.globalCollection.documentQueue,
        session.proofService
      );

    await imModelGenericQueue.queueTask(
      {
        data: {
          collectionName,
          merkleIndex: BigInt(metadataDocument.merkleIndex),
          newDocumentHash: undefined,
          operationKind: EDocumentOperation.Delete,
          previousDocumentObjectId: oldDocumentObjectId.toString(),
          currentDocumentObjectId: null,
          docId,
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }
}
