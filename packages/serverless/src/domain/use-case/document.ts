// TODO: need end to end testing for every function in this file
// TODO: debug types to annotate the actual correct types

import {
  EDatabaseProofStatus,
  ESequencer,
  PERMISSION_DEFAULT_VALUE,
  TDocumentField,
  TDocumentReadResponse,
  TDocumentRecordResponse,
  TMetadataDocument,
  TPagination,
  TPaginationReturn,
  TWithProofStatus,
} from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import {
  CompoundSession,
  DB,
  ModelQueueTask,
  ModelSequencer,
  TaskEntity,
  withTransaction,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import {
  ZKDATABASE_GROUP_SYSTEM,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import ModelDocument from '../../model/abstract/document.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import { FilterCriteria, parseQuery } from '../utils/document.js';
import { isDatabaseOwner } from './database.js';
import { getUsersGroup } from './group.js';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';
import {
  proveCreateDocument,
  proveDeleteDocument,
  proveUpdateDocument,
} from './prover.js';

/** Transform an array of document fields to a document record. */
export function fieldArrayToRecord(
  fields: TDocumentField[]
): Record<string, TDocumentField> {
  return fields.reduce(
    (acc, field) => {
      acc[field.name] = field;
      return acc;
    },
    {} as Record<string, TDocumentField>
  );
}

async function readDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  session?: ClientSession
): Promise<TDocumentReadResponse | null> {
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

  const documentRecord = await modelDocument.findOne(
    parseQuery(filter),
    session
  );

  if (!documentRecord) {
    return null;
  }

  const hasReadPermission = await hasDocumentPermission(
    databaseName,
    collectionName,
    actor,
    documentRecord.docId,
    'read',
    session
  );

  if (!hasReadPermission) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
    );
  }

  return {
    docId: documentRecord.docId,
    document: ModelDocument.deserializeDocument(documentRecord.document),
    createdAt: documentRecord.createdAt,
  };
}

async function createDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  fields: TDocumentField[],
  permission = PERMISSION_DEFAULT_VALUE,
  compoundSession?: CompoundSession
) {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'create',
      compoundSession?.sessionService
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'create' permission for collection '${collectionName}'.`
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  if (fields.length === 0) {
    throw new Error('Document array is empty. At least one field is required.');
  }

  // Save the document to the database
  const insertResult = await modelDocument.insertOneFromFields(
    ModelDocument.serializeDocument(fieldArrayToRecord(fields)),
    undefined,
    compoundSession?.sessionService
  );

  // 2. Create new sequence value
  const sequencer = ModelSequencer.getInstance(databaseName);
  const merkleIndex = await sequencer.nextValue(
    ESequencer.MerkleIndex,
    compoundSession?.sessionService
  );

  // 3. Create Metadata
  const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

  const modelSchema = ModelMetadataCollection.getInstance(databaseName);

  const documentSchema = await modelSchema.getMetadata(collectionName, {
    session: compoundSession?.sessionService,
  });

  if (!documentSchema) {
    throw new Error('Cannot get documentSchema');
  }

  const { permission: collectionPermission } = documentSchema;

  const permissionCombine = Permission.from(permission).combine(
    Permission.from(collectionPermission)
  );

  await modelDocumentMetadata.insertOne(
    {
      collectionName,
      docId: insertResult.docId,
      merkleIndex: merkleIndex.toString(),
      ...{
        // I'm set these to system user and group as default
        // In case this permission don't override by the user
        // this will prevent the user from accessing the data
        group: ZKDATABASE_GROUP_SYSTEM,
        owner: ZKDATABASE_USER_SYSTEM,
      },
      // Overwrite inherited permission with the new one
      permission: permissionCombine.value,
      owner: actor,
      group: documentSchema.group,
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    },
    { session: compoundSession?.sessionService }
  );

  const witness = await proveCreateDocument(
    databaseName,
    collectionName,
    insertResult.docId,
    fields,
    compoundSession
  );

  return witness;
}

async function updateDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  update: TDocumentField[]
) {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'write'
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'write' permission for collection '${collectionName}'.`
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);
  const documentRecord = await withTransaction(async (session) => {
    const oldDocumentRecord = await modelDocument.findOne(
      parseQuery(filter),
      session
    );

    if (oldDocumentRecord) {
      if (
        !(await hasDocumentPermission(
          databaseName,
          collectionName,
          actor,
          oldDocumentRecord.docId,
          'write',
          session
        ))
      ) {
        throw new Error(
          `Access denied: Actor '${actor}' does not have 'write' permission for the specified document.`
        );
      }

      if (update.length === 0) {
        throw new Error(
          'Document array is empty. At least one field is required.'
        );
      }

      await modelDocument.updateOne(
        oldDocumentRecord.docId,
        ModelDocument.serializeDocument(fieldArrayToRecord(update)),
        session
      );

      return oldDocumentRecord;
    }
  });

  if (documentRecord) {
    const witness = await proveUpdateDocument(
      databaseName,
      collectionName,
      documentRecord.docId,
      update
    );
    return witness;
  }

  throw Error(
    'Invalid query, the amount of documents that satisfy filter must be only one'
  );
}

async function deleteDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria
) {
  const result = await withTransaction(async (session) => {
    if (
      !(await hasCollectionPermission(
        databaseName,
        collectionName,
        actor,
        'delete',
        session
      ))
    ) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'delete' permission for collection '${collectionName}'.`
      );
    }

    const modelDocument = ModelDocument.getInstance(
      databaseName,
      collectionName
    );

    const findResult = await modelDocument.findOne(parseQuery(filter), session);

    if (findResult) {
      if (
        !(await hasDocumentPermission(
          databaseName,
          collectionName,
          actor,
          findResult.docId,
          'delete',
          session
        ))
      ) {
        throw new Error(
          `Access denied: Actor '${actor}' does not have 'delete' permission for the specified document.`
        );
      }
      await modelDocument.dropOne(findResult.docId);
    }

    return findResult;
  });
  if (result) {
    const witness = await proveDeleteDocument(
      databaseName,
      collectionName,
      result.docId
    );
    return witness;

    // TODO: Should we remove document metadata ???????
    // const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
    // await modelDocumentMetadata.deleteOne(
    //   { docId: findResult[0].docId },
    //   { session }
    // );
  }

  throw Error('Document not found');
}

function buildPipeline(matchQuery: any, pagination?: TPagination): Array<any> {
  return [
    {
      $lookup: {
        from: zkDatabaseConstants.databaseCollections.permission,
        let: { docId: '$docId' },
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
    {
      $match: matchQuery,
    },
    {
      $skip: pagination?.offset || 0,
    },
    {
      $limit: pagination?.limit || 10,
    },
  ];
}

export function filterDocumentsByPermission(
  listDocument: Array<any>,
  actor: string,
  userGroups: Array<string>
): Array<any> {
  return listDocument.filter(({ metadata }) => {
    const permission = Permission.from(metadata.permission);
    if (!metadata) {
      return false;
    }
    if (metadata.owner === actor) {
      return permission.owner.read;
    }
    if (userGroups.includes(metadata.group)) {
      return permission.group.read;
    }
    return permission.other.read;
  });
}

// TODO: might need to reconsider better type annotation
type TDocumentResponse = Omit<
  TDocumentRecordResponse,
  '_id' | 'active' | 'updatedAt'
>;

// TODO: might need to reconsider better type annotation
type TDocumentWithMetadataResponse = TDocumentResponse & {
  metadata: Omit<TMetadataDocument, 'collectionName' | 'docId'>;
};

async function findDocumentsWithMetadata(
  databaseName: string,
  collectionName: string,
  actor: string,
  query?: FilterCriteria,
  pagination?: TPagination,
  session?: ClientSession
): Promise<TWithProofStatus<TDocumentWithMetadataResponse>[]> {
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
    const tasks =
      await ModelQueueTask.getInstance().getTasksByCollection(collectionName);

    const pipeline = buildPipeline(
      query ? parseQuery(query) : null,
      pagination
    );

    const documentsWithMetadata = await documentsCollection
      .aggregate(pipeline)
      .toArray();

    // TODO: might need to reconsider proper type annotation
    let filteredDocuments: any[];

    if (!(await isDatabaseOwner(databaseName, actor))) {
      filteredDocuments = filterDocumentsByPermission(
        documentsWithMetadata,
        actor,
        userGroups
      );
    } else {
      filteredDocuments = documentsWithMetadata;
    }

    const transformedDocuments = filteredDocuments.map((documentRecord) => {
      const task = tasks?.find(
        (taskEntity: TaskEntity) =>
          taskEntity.docId === documentRecord._id.toString()
      );

      const document = {
        docId: documentRecord._id,
        document: fieldArrayToRecord(documentRecord.document),
        createdAt: documentRecord.createdAt,
      };

      const metadata = {
        merkleIndex: documentRecord.metadata.merkleIndex,
        group: documentRecord.metadata.group,
        owner: documentRecord.metadata.owner,
        permission: documentRecord.metadata.permission,
      };

      // TODO: monkey patching for now because we might also need to refactor
      // queue if we're to change status to enum
      const mapStatusToProofStatus = (status: string): EDatabaseProofStatus => {
        switch (status) {
          case 'queued':
            return EDatabaseProofStatus.None;
          case 'proving':
            return EDatabaseProofStatus.Proving;
          case 'proved':
            return EDatabaseProofStatus.Proved;
          case 'failed':
            return EDatabaseProofStatus.Failed;
          default:
            // TODO: is this variant correct in this case?
            return EDatabaseProofStatus.None;
        }
      };

      const object = {
        ...document,
        metadata,
        proofStatus: mapStatusToProofStatus(task ? task.status.toString() : ''),
      };

      return object;
    });

    return transformedDocuments;
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

async function searchDocuments(
  databaseName: string,
  collectionName: string,
  actor: string,
  query?: FilterCriteria,
  pagination: TPagination = { offset: 0, limit: 100 },
  session: ClientSession | undefined = undefined
): Promise<TPaginationReturn<Array<TDocumentResponse>>> {
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

    const pipeline = buildPipeline(
      query ? { ...parseQuery(query), active: true } : null,
      pagination
    );

    const documentsWithMetadata = await documentsCollection
      .aggregate(pipeline)
      .toArray();

    // TODO: might need to reconsider proper type annotation
    let filteredDocuments: any[];

    if (!(await isDatabaseOwner(databaseName, actor))) {
      filteredDocuments = filterDocumentsByPermission(
        documentsWithMetadata,
        actor,
        userGroups
      );
    } else {
      filteredDocuments = documentsWithMetadata;
    }

    const transformedDocuments = filteredDocuments.map((documentRecord) => {
      return {
        docId: documentRecord.docId,
        document: fieldArrayToRecord(documentRecord.document),
        createdAt: documentRecord.timestamp,
      };
    });

    return {
      data: transformedDocuments,
      offset: pagination.offset,
      total: await ModelDocument.getInstance(
        databaseName,
        collectionName
      ).countActiveDocuments(),
    };
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

export {
  createDocument,
  deleteDocument,
  findDocumentsWithMetadata,
  readDocument,
  searchDocuments,
  updateDocument,
};

export type TDocument = {
  docId: string;
  active: boolean;
  document: Record<string, TDocumentField>;
};
