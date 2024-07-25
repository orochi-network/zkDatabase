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
} from '../../common/permission';
import ModelDocument, { DocumentRecord } from '../../model/abstract/document';
import { Document } from '../types/document';
import { Permissions } from '../types/permission';
import { hasDocumentPermission, hasCollectionPermission } from './permission';
import {
  proveCreateDocument,
  proveDeleteDocument,
  proveUpdateDocument,
} from './prover';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import {
  ZKDATABASE_GROUP_SYSTEM,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const';
import { getCurrentTime } from '../../helper/common';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';
import { getUsersGroup } from './group';

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

  const documentRecord: DocumentRecord = {};

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

  const documentRecord: DocumentRecord = {};

  update.forEach((field) => {
    documentRecord[field.name] = {
      name: field.name,
      kind: field.kind,
      value: field.value,
    };
  });

  const oldDocumentRecord = await modelDocument.findOne(
    parseQuery(filter),
    session
  );

  const updateResult = await modelDocument.collection.updateMany(
    parseQuery(filter),
    {
      $set: documentRecord,
    },
    { session }
  );

  // We need to do this to make sure that only 1 record
  if (
    (updateResult.modifiedCount !== 1 && updateResult.matchedCount !== 1) ||
    !updateResult
  ) {
    throw new Error('Invalid update, modified count not equal to 1');
  }

  if (
    !(await hasDocumentPermission(
      databaseName,
      collectionName,
      actor,
      oldDocumentRecord!._id,
      'write',
      session
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'write' permission for the specified document.`
    );
  }

  await modelDocument.updateDocument(
    parseQuery(filter),
    documentRecord,
    session
  );

  const witness = await proveUpdateDocument(
    databaseName,
    collectionName,
    oldDocumentRecord!._id,
    update,
    session
  );

  return witness;
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

  const document = await modelDocument.findOne(parseQuery(filter), session);

  if (!document) {
    throw Error('Document does not exist');
  }

  if (
    !(await hasDocumentPermission(
      databaseName,
      collectionName,
      actor,
      document._id,
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
    document._id,
    session
  );

  await modelDocument.drop({ _id: document._id }, session);

  const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);

  await modelDocumentMetadata.deleteOne({ docId: document._id }, { session });

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

export {
  readManyDocuments,
  readDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};
