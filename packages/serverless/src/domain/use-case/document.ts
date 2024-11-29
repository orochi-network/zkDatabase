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
import { ClientSession, WithId } from 'mongodb';
import {
  PERMISSION_DEFAULT_VALUE,
  ZKDATABASE_GROUP_SYSTEM,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import ModelDocument, {
  DocumentRecord,
} from '../../model/abstract/document.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import { Document, DocumentFields } from '../types/document.js';
import { DocumentMetadata, WithMetadata } from '../types/metadata.js';
import { Pagination, PaginationReturn } from '../types/pagination.js';
import { WithProofStatus } from '../types/proof.js';
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

export function buildDocumentFields(
  documentRecord: WithId<DocumentRecord>
): DocumentFields {
  return Object.keys(documentRecord)
    .filter(
      (key) =>
        key !== '_id' &&
        key !== 'docId' &&
        key !== 'active' &&
        key !== 'timestamp' &&
        key !== 'metadata'
    )
    .map((key) => ({
      name: documentRecord[key].name,
      kind: documentRecord[key].kind,
      value: documentRecord[key].value,
    }));
}

function documentFieldsToDocumentRecord(
  document: DocumentFields
): DocumentRecord {
  return document.reduce((acc, field) => {
    let value: any = field.value as any;

    switch (field.kind) {
      case 'CircuitString':
        value = value.toString();
        break;
      case 'UInt32':
        value = parseInt(field.value, 10);
        break;
      case 'UInt64':
        value = parseInt(field.value, 10);
        break;
      case 'Bool':
        value = field.value.toLowerCase() === 'true';
        break;
      case 'Int64':
        value = parseInt(field.value, 10);
        break;
      default:
        break;
    }

    acc[field.name] = {
      name: field.name,
      kind: field.kind,
      value,
    };
    return acc;
  }, {} as DocumentRecord);
}

async function readDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  session?: ClientSession
): Promise<Document | null> {
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
    fields: buildDocumentFields(documentRecord),
    createdAt: documentRecord.timestamp!,
  };
}

async function createDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  document: DocumentFields,
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

  if (document.length === 0) {
    throw new Error('Document array is empty. At least one field is required.');
  }

  const documentRecord: DocumentRecord =
    documentFieldsToDocumentRecord(document);

  // Save the document to the database
  const insertResult = await modelDocument.insertOne(
    documentRecord,
    compoundSession?.sessionService
  );

  // 2. Create new sequence value
  const sequencer = ModelSequencer.getInstance(databaseName);
  const merkleIndex = await sequencer.getNextValue(
    'merkle-index',
    compoundSession?.sessionService
  );

  // 3. Create Metadata
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  const modelSchema = ModelCollectionMetadata.getInstance(databaseName);

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
      collection: collectionName,
      docId: insertResult.docId,
      merkleIndex,
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
    document,
    compoundSession
  );

  return witness;
}

async function updateDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  update: DocumentFields
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

      const documentRecord: DocumentRecord =
        documentFieldsToDocumentRecord(update);

      await modelDocument.updateOne(
        oldDocumentRecord.docId,
        documentRecord,
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

function buildPipeline(matchQuery: any, pagination?: Pagination): Array<any> {
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

async function findDocumentsWithMetadata(
  databaseName: string,
  collectionName: string,
  actor: string,
  query?: FilterCriteria,
  pagination?: Pagination,
  session?: ClientSession
): Promise<WithProofStatus<WithMetadata<Document>>[]> {
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
      const fields: DocumentFields = buildDocumentFields(documentRecord);

      const task = tasks?.find(
        (taskEntity: TaskEntity) =>
          taskEntity.docId === documentRecord._id.toString()
      );

      const document: Document = {
        docId: documentRecord._id,
        fields,
        createdAt: documentRecord.timestamp,
      };

      const metadata: DocumentMetadata = {
        merkleIndex: documentRecord.metadata.merkleIndex,
        groupName: documentRecord.metadata.group,
        userName: documentRecord.metadata.owner,
        permission: documentRecord.metadata.permission,
      };

      const object = {
        ...document,
        metadata,
        proofStatus: task ? task.status.toString() : '',
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
  pagination: Pagination = { offset: 0, limit: 100 },
  session: ClientSession | undefined = undefined
): Promise<PaginationReturn<Array<Document>>> {
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

    const transformedDocuments: Document[] = filteredDocuments.map(
      (documentRecord) => {
        const fields: DocumentFields = buildDocumentFields(documentRecord);

        return {
          docId: documentRecord.docId,
          fields,
          createdAt: documentRecord.timestamp,
        };
      }
    );

    return {
      data: transformedDocuments,
      offset: pagination.offset,
      totalSize: await ModelDocument.getInstance(
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
