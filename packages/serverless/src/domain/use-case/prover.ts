import { EDocumentOperation, TDocumentQueuedData } from '@zkdb/common';
import {
  TCompoundSession,
  ModelGenericQueue,
  zkDatabaseConstant,
} from '@zkdb/storage';

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
    operationNumber: number,
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

    const documentHash = schema.hash();

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
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }

  public static async update(
    proveUpdateParam: TParamProveUpdate,
    operationNumber: number,
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
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }

  public static async delete(
    proveDeleteParam: TParamProveDelete,
    operationNumber: number,
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
          operationKind: EDocumentOperation.Drop,
          docId,
        },
        databaseName,
        sequenceNumber: operationNumber,
      },
      { session: session.proofService }
    );
  }
}
