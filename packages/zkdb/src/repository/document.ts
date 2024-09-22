import { Permissions } from '../types/permission.js';
import { DocumentEncoded, ProvableTypeString } from '../sdk/schema.js';
import { MerkleWitness } from '../types/merkle-tree.js';
import { Field } from 'o1js';
import { FilterCriteria } from '../types/common.js';
import { Document } from '../types/document.js';
import {
  findDocument as findDocumentRequest,
  createDocument as createDocumentRequest,
  updateDocument as updateDocumentRequest,
  deleteDocument as deleteDocumentRequest,
  findDocuments as findDocumentsRequest,
} from '@zkdb/api';
import { Pagination } from '../types/pagination.js';

export async function findDocument(
  databaseName: string,
  collectionName: string,
  filter: FilterCriteria
): Promise<Document | null> {
  const result = await findDocumentRequest({
    databaseName,
    collectionName,
    documentQuery: JSON.parse(JSON.stringify(filter)),
  });

  const document = result.unwrap();
  return {
    id: document.docId,
    documentEncoded: document.fields.map((field) => ({
      name: field.name,
      kind: field.kind as ProvableTypeString,
      value: field.value,
    })),
    createdAt: document.createdAt,
  };
}

export async function createDocument(
  databaseName: string,
  collectionName: string,
  documentEncoded: DocumentEncoded,
  permissions: Permissions
): Promise<MerkleWitness> {
  const result = await createDocumentRequest({
    databaseName,
    collectionName,
    documentRecord: documentEncoded,
    documentPermission: permissions,
  });

  const merkleWitness = result.unwrap();

  return merkleWitness.map((node) => ({
    isLeft: node.isLeft,
    sibling: Field(node.sibling),
  }));
}

export async function updateDocument(
  databaseName: string,
  collectionName: string,
  documentEncoded: DocumentEncoded,
  filter: FilterCriteria
): Promise<MerkleWitness> {
  const result = await updateDocumentRequest({
    databaseName,
    collectionName,
    documentQuery: JSON.parse(JSON.stringify(filter)),
    documentRecord: documentEncoded,
  });

  const merkleWitness = result.unwrap();

  return merkleWitness.map((node) => ({
    isLeft: node.isLeft,
    sibling: Field(node.sibling),
  }));
}

export async function deleteDocument(
  databaseName: string,
  collectionName: string,
  filter: FilterCriteria
): Promise<MerkleWitness> {
  const result = await deleteDocumentRequest({
    databaseName,
    collectionName,
    documentQuery: JSON.parse(JSON.stringify(filter)),
  });

  const merkleWitness = result.unwrap();

  return merkleWitness.map((node) => ({
    isLeft: node.isLeft,
    sibling: Field(node.sibling),
  }));
}

export async function findDocuments(
  databaseName: string,
  collectionName: string,
  filter: FilterCriteria,
  pagination?: Pagination
): Promise<Document[]> {
  const result = await findDocumentsRequest({
    databaseName,
    collectionName,
    documentQuery: JSON.parse(JSON.stringify(filter)),
    pagination,
  });

  const documents = result.unwrap();

  return documents.map((document) => ({
    id: document.docId,
    documentEncoded: document.fields.map((field) => ({
      name: field.name,
      kind: field.kind as ProvableTypeString,
      value: field.value,
    })),
    createdAt: document.createdAt,
  }));
}
