import {
  DatabaseEngine,
  ModelQueueTask,
  ModelSequencer,
  TaskEntity,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { ClientSession, WithId, ObjectId } from 'mongodb';
import {
  PermissionBinary,
  setPartialIntoPermission,
} from '../../common/permission.js';
import ModelDocument, {
  DocumentRecord,
} from '../../model/abstract/document.js';
import { Document } from '../types/document.js';
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

export interface FilterCriteria {
  [key: string]: any;
}

function parseQuery(input: FilterCriteria): FilterCriteria {
  const query: FilterCriteria = {};

  Object.keys(input).forEach((key) => {
    if (key === '_id') {
      query[key] = new ObjectId(String(input[key]));
    } else {
      query[`${key}.value`] = `${input[key]}`;
    }
  });

  return query;
}

async function readDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  session?: ClientSession
): Promise<WithId<Document> | null> {
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
    documentRecord._id,
    'read',
    session
  );

  if (!hasReadPermission) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
    );
  }

  if (!documentRecord.isLatest) {
    throw Error('You cannot read the history document');
  }

  const document: Document = Object.keys(documentRecord)
    .filter((key) => key !== '_id') // Exclude '_id'
    .map((key) => ({
      name: documentRecord[key].name,
      kind: documentRecord[key].kind,
      value: documentRecord[key].value,
    }));

  return {
    _id: documentRecord._id,
    ...document,
  };
}

async function createDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  document: Document,
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

  const documentRecord = {
    isLatest: true,
  } as DocumentRecord;

  document.forEach((field) => {
    documentRecord[field.name] = {
      name: field.name,
      kind: field.kind,
      value: field.value,
    };
  });

  // 1. Save document
  const insertResult = await modelDocument.insertDocument(
    documentRecord,
    session
  );

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
      docId: insertResult.insertedId,
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
    insertResult.insertedId,
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
  update: Document,
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

  const oldDocumentRecord = await modelDocument.find(
    parseQuery(filter),
    session
  );

  if (oldDocumentRecord.length === 1) {
    if (
      !(await hasDocumentPermission(
        databaseName,
        collectionName,
        actor,
        oldDocumentRecord[0]._id,
        'write',
        session
      ))
    ) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'write' permission for the specified document.`
      );
    }

    await modelDocument.collection.updateOne(
      parseQuery(filter),
      { $set: { isLatest: false } },
      { session }
    );

    const documentRecord = {
      isLatest: true,
      prevVersion: oldDocumentRecord[0]._id,
    } as DocumentRecord;

    update.forEach((field) => {
      documentRecord[field.name] = {
        name: field.name,
        kind: field.kind,
        value: field.value,
      };
    });

    const insertResult = await modelDocument.collection.insertOne(
      documentRecord,
      { session }
    );

    const witness = await proveUpdateDocument(
      databaseName,
      collectionName,
      oldDocumentRecord[0]!._id,
      update,
      session
    );

    const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

    await modelDocumentMetadata.collection.updateMany(
      { docId: oldDocumentRecord[0]!._id },
      {
        $set: { docId: insertResult.insertedId },
      },
      { session }
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

  const findResult = await modelDocument.find(parseQuery(filter), session);

  if (findResult.length !== 1) {
    throw Error('Wrong query');
  }

  if (
    !(await hasDocumentPermission(
      databaseName,
      collectionName,
      actor,
      findResult[0]._id,
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
    findResult[0]._id,
    session
  );

  await modelDocument.insertDocument(
    {
      isLatest: true,
      prevVersion: findResult[0]._id,
    } as DocumentRecord,
    session
  );

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  await modelDocumentMetadata.deleteOne(
    { docId: findResult[0]._id },
    { session }
  );

  return witness;
}

async function readManyDocuments(
  databaseName: string,
  collectionName: string,
  actor: string,
  session?: ClientSession
) {
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

    const pipeline = [
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

    const documentsWithMetadata = await documentsCollection
      .aggregate(pipeline)
      .toArray();

    const result = documentsWithMetadata
      .filter(({ metadata }) => {
        if (!metadata) {
          return false;
        }
        if (metadata.owner === actor) {
          return PermissionBinary.fromBinaryPermission(metadata.permissionOwner)
            .read;
        }
        if (userGroups.includes(metadata.group)) {
          return PermissionBinary.fromBinaryPermission(metadata.permissionGroup)
            .read;
        }
        return PermissionBinary.fromBinaryPermission(metadata.permissionOther)
          .read;
      })
      .map((doc) => {
        const task = tasks?.find(
          (task: TaskEntity) => task.docId === doc._id.toString()
        );
        if (task) {
          return { ...doc, proofStatus: task?.status };
        }
        return { ...doc, proofStatus: undefined };
      });

    return result;
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
): Promise<Array<WithId<Document>>> {
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

    const pipeline = [
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
      {
        $match: matchQuery,
      },
      {
        $skip: pagination ? pagination.offset : 0,
      },
      {
        $limit: pagination ? pagination.limit : 10
      },
    ];

    const documentsWithMetadata = await documentsCollection
      .aggregate(pipeline)
      .toArray();

    const filteredDocuments = documentsWithMetadata.filter(({ metadata }) => {
      if (!metadata) {
        return false;
      }
      if (metadata.owner === actor) {
        return PermissionBinary.fromBinaryPermission(metadata.permissionOwner)
          .read;
      }
      if (userGroups.includes(metadata.group)) {
        return PermissionBinary.fromBinaryPermission(metadata.permissionGroup)
          .read;
      }
      return PermissionBinary.fromBinaryPermission(metadata.permissionOther)
        .read;
    });

    const transformedDocuments = filteredDocuments.map((documentRecord) => {
      const document: Document = Object.keys(documentRecord)
        .filter(
          (key) => key !== '_id' && key !== 'metadata' && key !== 'isLatest'
        )
        .map((key) => ({
          name: documentRecord[key].name,
          kind: documentRecord[key].kind,
          value: documentRecord[key].value,
        }));

      return {
        _id: documentRecord._id,
        document,
      };
    });

    return transformedDocuments as any as WithId<Document>[];
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

export {
  readManyDocuments,
  readDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
};
