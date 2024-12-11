/* eslint-disable import/prefer-default-export */
import {
  TDocumentHistory,
  TDocumentHistoryListResponse,
  TMetadataDocument,
  TPagination,
} from '@zkdb/common';
import { DB, zkDatabaseConstant } from '@zkdb/storage';
import assert from 'assert';
import { ClientSession, ObjectId } from 'mongodb';
import ModelDocument, {
  TDocumentRecordSerialized,
} from '../../model/abstract/document.js';
import { isDatabaseOwner } from './database.js';
import { filterDocumentsByPermission } from './document.js';
import { getUsersGroup } from './group.js';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';

function buildHistoryPipeline(pagination: TPagination): Array<any> {
  return [
    {
      $group: {
        _id: '$docId',
        documents: { $push: '$$ROOT' },
      },
    },
    {
      $sort: { docId: 1, createdAt: 1 },
    },
    {
      $match: {
        _id: { $ne: null },
      },
    },
    {
      $skip: pagination.offset,
    },
    {
      $limit: pagination.limit,
    },
    {
      $lookup: {
        from: zkDatabaseConstant.databaseCollection.permission,
        let: { docId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$docId', '$$docId'] },
            },
          },
          {
            $project: {
              permission: true,
              merkleIndex: true,
              group: true,
              owner: true,
            },
          },
        ],
        as: 'metadata',
      },
    },
    {
      $unwind: '$metadata',
    },
  ];
}

/** The data being returned by the mongodb pipeline above.
 * TODO: Need debugging to actually confirm this */
type TDocumentHistorySerialized = {
  _id: ObjectId;
  documents: TDocumentRecordSerialized[];
  metadata: Omit<TMetadataDocument, 'collectionName'>;
  active: boolean;
};

async function listDocumentHistory(
  databaseName: string,
  collectionName: string,
  actor: string,
  pagination: TPagination,
  session?: ClientSession
): Promise<TDocumentHistoryListResponse> {
  if (
    await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    )
  ) {
    const { client } = DB.service;

    const database = client.db(databaseName);
    const documentsCollection = database.collection(collectionName);

    const userGroups = await getUsersGroup(databaseName, actor);

    const pipeline = buildHistoryPipeline(pagination);

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
          document: Object.values(
            ModelDocument.deserializeDocument(doc.document)
          ),
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

async function findDocumentHistory(
  databaseName: string,
  collectionName: string,
  actor: string,
  docId: string,
  session?: ClientSession
): Promise<TDocumentHistory | null> {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  const latestDocument = await modelDocument.findHistoryOne(docId, session);

  if (!latestDocument) {
    return null;
  }

  const hasReadPermission = await hasDocumentPermission(
    databaseName,
    collectionName,
    actor,
    docId,
    'read',
    session
  );

  if (!hasReadPermission) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
    );
  }

  const documentHistoryRecords = await modelDocument.findHistoryOne(
    docId,
    session
  );

  throw new Error(
    `this whole function needs to be refactored to remove duplicate logic and \
add document metadata`
  );

  return {
    docId,
    documents: documentHistoryRecords.map((doc) => ({
      ...doc,
      document: Object.values(ModelDocument.deserializeDocument(doc.document)),
    })),
    active: documentHistoryRecords[0].active,
    metadata: {} as any, // TODO:
  };
}

export { listDocumentHistory, findDocumentHistory };
