/* eslint-disable import/prefer-default-export */
import { PermissionBinary } from '@common';
import { DocumentRecord, ModelDocument } from '@model';
import { DatabaseEngine, zkDatabaseConstants } from '@zkdb/storage';
import { ClientSession, WithId } from 'mongodb';
import {
  Document,
  DocumentFields,
  HistoryDocument,
  Pagination,
} from '../types';
import { isDatabaseOwner } from './database';
import { getUsersGroup } from './group';
import { hasCollectionPermission, hasDocumentPermission } from './permission';

function buildDocumentFields(
  documentRecord: WithId<DocumentRecord>
): DocumentFields {
  return Object.keys(documentRecord)
    .filter(
      (key) =>
        key !== '_id' &&
        key !== 'docId' &&
        key !== 'deleted' &&
        key !== 'timestamp'
    )
    .map((key) => ({
      name: documentRecord[key].name,
      kind: documentRecord[key].kind,
      value: documentRecord[key].value,
    }));
}

function buildHistoryPipeline(pagination: Pagination): Array<any> {
  return [
    {
      $group: {
        _id: '$docId',
        documents: { $push: '$$ROOT' },
      },
    },
    {
      $sort: { docId: 1, timestamp: 1 },
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
        from: zkDatabaseConstants.databaseCollections.permission,
        let: { docId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$docId', '$$docId'] },
            },
          },
          {
            $project: {
              permissionOwner: true,
              permissionGroup: true,
              permissionOther: true,
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

function filterDocumentsByPermissions(
  documents: Array<any>,
  actor: string,
  userGroups: Array<string>
): Array<any> {
  return documents.filter(({ metadata }) => {
    if (!metadata) return false;
    if (metadata.owner === actor) {
      return PermissionBinary.fromBinaryPermission(metadata.permissionOwner)
        .read;
    }
    if (userGroups.includes(metadata.group)) {
      return PermissionBinary.fromBinaryPermission(metadata.permissionGroup)
        .read;
    }
    return PermissionBinary.fromBinaryPermission(metadata.permissionOther).read;
  });
}

async function listHistoryDocuments(
  databaseName: string,
  collectionName: string,
  actor: string,
  pagination: Pagination,
  session?: ClientSession
): Promise<HistoryDocument[]> {
  if (
    await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    )
  ) {
    const { client } = DatabaseEngine.getInstance();

    const database = client.db(databaseName);
    const documentsCollection = database.collection(collectionName);

    const userGroups = await getUsersGroup(databaseName, actor);

    const pipeline = buildHistoryPipeline(pagination);

    const documentsWithMetadata = await documentsCollection
      .aggregate(pipeline)
      .toArray();

    let filteredDocuments: any[];

    if (!(await isDatabaseOwner(databaseName, actor))) {
      filteredDocuments = filterDocumentsByPermissions(
        documentsWithMetadata,
        actor,
        userGroups
      );
    } else {
      filteredDocuments = documentsWithMetadata;
    }

    const result = filteredDocuments.map((historyDocument) => {
      const documents = historyDocument.documents.map((document: any) => ({
        fields: buildDocumentFields(document),
        docId: historyDocument._id,
        createdAt: historyDocument.timestamp,
      }));

      return {
        docId: historyDocument._id,
        documents,
        metadata: historyDocument.metadata,
        deleted: historyDocument.deleted,
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
): Promise<HistoryDocument | null> {
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

  const documents: Document[] = documentHistoryRecords.map((documentRecord) => {
    const document = buildDocumentFields(documentRecord);

    return {
      docId: documentRecord.docId,
      fields: document,
      createdAt: documentRecord.timestamp!,
    };
  });

  return {
    docId,
    documents,
    deleted: documentHistoryRecords[0].deleted,
  };
}

export { listHistoryDocuments, readHistoryDocument };
