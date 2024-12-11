/* eslint-disable import/prefer-default-export */
import { TPickOptional } from '@orochi-network/framework';
import {
  TDocumentHistory as TDocumentHistoryBase,
  TDocumentRecord,
  TMetadataDocument,
  TPagination,
  TSingleDocumentHistory,
} from '@zkdb/common';
import { DB, zkDatabaseConstant } from '@zkdb/storage';
import assert from 'assert';
import { ClientSession, ObjectId } from 'mongodb';
import ModelDocument, {
  TDocumentRecordSerialized,
} from '../../model/abstract/document.js';
import { isDatabaseOwner } from './database.js';
import { PermissionSecurity } from './permission-security.js';
import { DEFAULT_PAGINATION } from 'common/const.js';

/** The data being returned by the mongodb pipeline above.
 * TODO: Need debugging to actually confirm this */
type TDocumentHistorySerialized = {
  _id: ObjectId;
  documents: TDocumentRecordSerialized[];
  metadata: Omit<TMetadataDocument, 'collectionName'>;
  active: boolean;
};

type TDocumentHistory = Omit<TDocumentHistoryBase, 'documents'> & {
  documents: TPickOptional<TDocumentRecord, 'previousObjectId'>[];
};

async function listHistoryDocument(
  databaseName: string,
  collectionName: string,
  docId: string,
  actor: string,
  pagination: TPagination,
  session?: ClientSession
): Promise<TDocumentHistory[]> {
  const actorPermission = await PermissionSecurity.collection(
    databaseName,
    collectionName,
    actor,
    session
  );
  if (actorPermission.read) {
    const { client } = DB.service;
    const paginationInfo = pagination || DEFAULT_PAGINATION;
    const pipeline = [
      {
        $match: {
          _id: { $ne: null },
          docId,
        },
      },
      {
        $group: {
          docId: '$docId',
          documentRevision: { $push: '$$ROOT' },
        },
      },
      {
        $sort: { docId: 1, createdAt: 1 },
      },
      {
        $lookup: {
          from: zkDatabaseConstant.databaseCollection.metadataDocument,
          let: { docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$docId', '$$docId'] },
              },
            },
          ],
          as: 'metadata',
        },
      },
      {
        $skip: paginationInfo.offset,
      },
      {
        $limit: paginationInfo.limit,
      },
    ];

    const database = client.db(databaseName);
    const documentsCollection = database.collection(collectionName);

    const listGroup = await PermissionSecurity.listGroupOfUser(
      databaseName,
      actor
    );

    const documentsWithMetadata = (await documentsCollection
      .aggregate(pipeline)
      // TODO: need debugging to confirm the accuracy of this type annotation
      .toArray()) as TDocumentHistorySerialized[];

    let filteredDocuments: TDocumentHistorySerialized[] = [];

    if (!(await isDatabaseOwner(databaseName, actor))) {
      filteredDocuments = filterDocumentsByPermission(
        documentsWithMetadata,
        actor,
        userGroups
      );
    } else {
      filteredDocuments = documentsWithMetadata;
    }

    const result = filteredDocuments.map((historyDocument) => {
      assert(
        historyDocument.documents.length > 0,
        `Document history is empty, which should not happen if we expect the \
MongoDB pipeline to already handle this case`
      );

      return {
        docId: historyDocument.documents[0].docId,
        documents: historyDocument.documents.map((doc) => ({
          ...doc,
          document: ModelDocument.deserializeDocument(doc.document),
        })),
        metadata: {
          ...historyDocument.metadata,
          collectionName,
        },
        active: historyDocument.active,
      };
    });

    return result;
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

async function readHistoryDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string,
  session?: ClientSession
): Promise<TSingleDocumentHistory | null> {
  const actorPermissionCollection = await PermissionSecurity.collection(
    databaseName,
    collectionName,
    actor,
    session
  );
  if (!actorPermissionCollection.read) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  const latestDocument = await modelDocument.findHistoryOne(docId, session);

  if (!latestDocument) {
    return null;
  }
  const actorPermissionDocument = await PermissionSecurity.document(
    databaseName,
    collectionName,
    actor,
    docId,
    session
  );

  if (!actorPermissionDocument.read) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
    );
  }

  const documentHistoryRecords = await modelDocument.findHistoryOne(
    docId,
    session
  );

  return {
    docId,
    documents: documentHistoryRecords.map((doc) => ({
      ...doc,
      document: ModelDocument.deserializeDocument(doc.document),
    })),
    active: documentHistoryRecords[0].active,
  };
}

export { listHistoryDocuments, readHistoryDocument };
