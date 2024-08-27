import {
  DatabaseEngine,
  ModelQueueTask,
  ModelSequencer,
  TaskEntity,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { ClientSession, WithId } from 'mongodb';
import { WithProofStatus } from '../types/proof.js';
import {
  PermissionBinary,
  setPartialIntoPermission,
} from '../../common/permission.js';
import ModelDocument, {
  DocumentRecord,
} from '../../model/abstract/document.js';
import { Document, DocumentFields } from '../types/document.js';
import { Permissions } from '../types/permission.js';
import {
  hasDocumentPermission,
  hasCollectionPermission,
} from './permission.js';
import {
  proveCreateDocument,
  proveDeleteDocument,
  proveUpdateDocument,
} from './prover.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import {
  ZKDATABASE_GROUP_SYSTEM,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import { getUsersGroup } from './group.js';
import { Pagination } from '../types/pagination.js';
import { SearchInput } from '../types/search.js';
import buildMongoQuery from '../query/mongodb-filter.js';
import { isDatabaseOwner } from './database.js';
import { FilterCriteria, parseQuery } from '../utils/document.js';
import { DocumentMetadata, WithMetadata } from '../types/metadata.js';

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
  permissions: Permissions,
  session?: ClientSession
) {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'create',
      session
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

  const documentRecord: DocumentRecord = document.reduce((acc, field) => {
    acc[field.name] = {
      name: field.name,
      kind: field.kind,
      value: field.value,
    };
    return acc;
  }, {} as DocumentRecord);

  // Save the document to the database
  const insertResult = await modelDocument.insertOne(documentRecord, session);

  // 2. Create new sequence value
  const sequencer = ModelSequencer.getInstance(databaseName);
  const merkleIndex = await sequencer.getNextValue('merkle-index', session);

  // 3. Create Metadata
  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  const modelSchema = ModelCollectionMetadata.getInstance(databaseName);

  const documentSchema = await modelSchema.getMetadata(collectionName, {
    session,
  });

  const {
    permissionOwner: collectionPermissionOwner,
    permissionGroup: collectionPermissionGroup,
    permissionOther: collectionPermissionOther,
  } = documentSchema;

  // TODO: Can we simplify the code by applying binary operations ?
  const permissionOwner = PermissionBinary.toBinaryPermission(
    setPartialIntoPermission(
      PermissionBinary.fromBinaryPermission(collectionPermissionOwner),
      permissions.permissionOwner
    )
  );

  const permissionGroup = PermissionBinary.toBinaryPermission(
    setPartialIntoPermission(
      PermissionBinary.fromBinaryPermission(collectionPermissionGroup),
      permissions.permissionGroup
    )
  );

  const permissionOther = PermissionBinary.toBinaryPermission(
    setPartialIntoPermission(
      PermissionBinary.fromBinaryPermission(collectionPermissionOther),
      permissions.permissionOther
    )
  );

  await modelDocumentMetadata.insertOne(
    {
      collection: collectionName,
      docId: insertResult.docId!,
      merkleIndex,
      ...{
        // I'm set these to system user and group as default
        // In case this permission don't override by the user
        // this will prevent the user from accessing the data
        group: ZKDATABASE_GROUP_SYSTEM,
        owner: ZKDATABASE_USER_SYSTEM,
      },
      // Overwrite inherited permission with the new one
      permissionOwner,
      permissionGroup,
      permissionOther,
      owner: actor,
      group: documentSchema.group,
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    },
    { session }
  );

  // 4. Prove document creation
  const witness = await proveCreateDocument(
    databaseName,
    collectionName,
    insertResult.docId!,
    document,
    session
  );

  return witness;
}

async function updateDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  update: DocumentFields,
  session?: ClientSession
) {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'write',
      session
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'write' permission for collection '${collectionName}'.`
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

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

    const documentRecord: DocumentRecord = update.reduce((acc, field) => {
      acc[field.name] = {
        name: field.name,
        kind: field.kind,
        value: field.value,
      };
      return acc;
    }, {} as DocumentRecord);

    await modelDocument.updateOne(
      oldDocumentRecord.docId,
      documentRecord!,
      session
    );

    const witness = await proveUpdateDocument(
      databaseName,
      collectionName,
      oldDocumentRecord.docId!,
      update,
      session
    );

    // const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

    // await modelDocumentMetadata.collection.updateMany(
    //   { docId: oldDocumentRecord[0]!.docId},
    //   {
    //     $set: { docId: insertResult.insertedId },
    //   },
    //   { session }
    // );

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
  filter: FilterCriteria,
  session?: ClientSession
) {
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

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  const findResult = await modelDocument.findOne(parseQuery(filter), session);

  console.log('findResult', findResult);
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

    const witness = await proveDeleteDocument(
      databaseName,
      collectionName,
      findResult.docId,
      session
    );

    await modelDocument.dropOne(findResult.docId);

    // TODO: Should we remove document metadata ???????
    // const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
    // await modelDocumentMetadata.deleteOne(
    //   { docId: findResult[0].docId },
    //   { session }
    // );

    return witness;
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

async function searchAggregatedDocuments(
  databaseName: string,
  collectionName: string,
  actor: string,
  query?: SearchInput<any>,
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
    const { client } = DatabaseEngine.getInstance();

    const database = client.db(databaseName);
    const documentsCollection = database.collection(collectionName);

    const userGroups = await getUsersGroup(databaseName, actor);
    const tasks =
      await ModelQueueTask.getInstance().getTasksByCollection(collectionName);

    const matchQuery = buildMongoQuery(query);

    const pipeline = buildPipeline(matchQuery, pagination);

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

    const transformedDocuments = filteredDocuments.map((documentRecord) => {
      const fields: DocumentFields = buildDocumentFields(documentRecord);

      const task = tasks?.find(
        (taskEntity: TaskEntity) =>
          taskEntity.docId === (documentRecord as any)._id.toString()
      );

      const document: Document = {
        docId: documentRecord._id,
        fields,
        createdAt: documentRecord.timestamp,
      };

      const metadata: DocumentMetadata = {
        merkleIndex: documentRecord.metadata.merkleIndex,
        owners: {
          group: documentRecord.metadata.group,
          owner: documentRecord.metadata.owner,
        },
        permissions: {
          permissionOwner: PermissionBinary.fromBinaryPermission(
            documentRecord.metadata.permissionOwner
          ),
          permissionGroup: PermissionBinary.fromBinaryPermission(
            documentRecord.metadata.permissionGroup
          ),
          permissionOther: PermissionBinary.fromBinaryPermission(
            documentRecord.metadata.permissionOther
          ),
        },
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
  query?: SearchInput<any>,
  pagination?: Pagination,
  session?: ClientSession
): Promise<Array<Document>> {
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

    const matchQuery = buildMongoQuery(query);

    const pipeline = buildPipeline(matchQuery, pagination);

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

    return transformedDocuments;
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

export {
  searchAggregatedDocuments,
  readDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
};
