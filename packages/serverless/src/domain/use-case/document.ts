import { PermissionBinary, partialToPermission } from '../../common/permission';
import ModelDocument, { DocumentRecord } from '../../model/abstract/document';
import { Document } from '../types/document';
import { Permissions } from '../types/permission';
import { checkDocumentPermission, checkPermission } from './permission';

export interface FilterCriteria {
  [key: string]: any;
}

async function readDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria
): Promise<Document | null> {
  if (!checkPermission(databaseName, collectionName, actor, 'read')) {
    throw new Error(
      'Access denied: The actor does not have read permission to read this collection'
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  const documentRecord = await modelDocument.findOne(filter);

  if (!documentRecord) {
    throw new Error('Document not found.');
  }

  const hasReadPermission = await checkDocumentPermission(
    databaseName,
    collectionName,
    actor,
    documentRecord._id,
    'read'
  );

  if (!hasReadPermission) {
    throw new Error(
      'Access denied: The actor does not have read permission for the specified document.'
    );
  }

  const document: Document = Object.keys(documentRecord).map(key => ({
    name: documentRecord[key].name,
    kind: documentRecord[key].kind,
    value: documentRecord[key].value,
  }));

  return document;
}

async function createDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  document: Document,
  permissions: Permissions
) {
  if (!checkPermission(databaseName, collectionName, actor, 'create')) {
    throw new Error(
      'Access denied: The actor does not have read permission to create document to this collection'
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  const documentRecord: DocumentRecord = {};

  document.forEach(field => {
    documentRecord[field.name] = { name: field.name, kind: field.kind, value: field.value };
  });

  const permissionOwner = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionOwner)
  );
  const permissionGroup = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionGroup)
  );
  const permissionOther = PermissionBinary.toBinaryPermission(
    partialToPermission(permissions.permissionOthers)
  );
  
  await modelDocument.insertOne(documentRecord, {
    permissionOwner,
    permissionGroup,
    permissionOther
  })
}

async function updateDocument(
  databaseName: string,
  collectionName: string,
  actor: string,
  filter: FilterCriteria,
  document: Document
) {
  if (!checkPermission(databaseName, collectionName, actor, 'write')) {
    throw new Error(
      'Access denied: The actor does not have read permission to write document to this collection'
    );
  }

  const modelDocument = ModelDocument.getInstance(databaseName, collectionName);

  const documentRecord: DocumentRecord = {};

  document.forEach(field => {
    documentRecord[field.name] = { name: field.name, kind: field.kind, value: field.value };
  });

  await modelDocument.updateOne(filter, documentRecord)
}


export {
  readDocument,
  createDocument,
  updateDocument
}