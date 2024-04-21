import { ModelSequencer } from '@zkdb/storage';
import { ClientSession, WithId } from 'mongodb';
import { PermissionBinary, partialToPermission } from '../../common/permission';
import ModelDocument, { DocumentRecord } from '../../model/abstract/document';
import { Document } from '../types/document';
import { Permissions } from '../types/permission';
import {
  checkDocumentPermission,
  checkCollectionPermission,
} from './permission';
import { proveCreateDocument, proveDeleteDocument } from './prover';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import {
  ZKDATABASE_GROUP_SYSTEM,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const';
import { getCurrentTime } from '../../helper/common';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';

export interface FilterCriteria {
  [key: string]: any;
}

function parseQuery(input: FilterCriteria): FilterCriteria {
  const query: FilterCriteria = {};
  Object.keys(input).forEach((key) => {
    query[`${key}.value`] = `${input[key]}`;
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
    !(await checkCollectionPermission(
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

  const hasReadPermission = await checkDocumentPermission(
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
    !(await checkCollectionPermission(
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

  const documentPermissionOwner = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionOwner)
  );
  const documentPermissionGroup = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionGroup)
  );
  const documentPermissionOther = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionOther)
  );

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

  const { permissionOwner, permissionGroup, permissionOther } = documentSchema;

  await modelDocumentMetadata.insertOne(
    {
      collection: collectionName,
      docId: insertResult.insertedId,
      merkleIndex,
      ...{
        permissionOwner,
        permissionGroup,
        permissionOther,
        // I'm set these to system user and group as default
        // In case this permission don't override by the user
        // this will prevent the user from accessing the data
        group: ZKDATABASE_GROUP_SYSTEM,
        owner: ZKDATABASE_USER_SYSTEM,
      },
      // Overwrite inherited permission with the new one
      permissionOwner: documentPermissionOwner,
      permissionGroup: documentPermissionGroup,
      permissionOther: documentPermissionOther,
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
    !(await checkCollectionPermission(
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

  const updateResult = await modelDocument.collection.updateMany(
    filter,
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

  const oldDocumentRecord = await modelDocument.findOne(filter, session);

  if (
    !(await checkDocumentPermission(
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

  await modelDocument.updateDocument(filter, documentRecord, session);
}

async function deleteDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  session?: ClientSession
) {
  if (
    !(await checkCollectionPermission(
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

  const document = await modelDocument.findOne(filter, session);

  if (!document) {
    throw Error('Document does not exist');
  }

  if (
    !(await checkDocumentPermission(
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

export { readDocument, createDocument, updateDocument, deleteDocument };
