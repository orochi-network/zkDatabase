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
  const result = await findDocumentRequest(
    databaseName,
    collectionName,
    JSON.parse(JSON.stringify(filter))
  );

  if (result.isOne()) {
    const document = result.unwrapObject();
    return {
      id: document.docId,
      documentEncoded: document.fields.map((field) => ({
        name: field.name,
        kind: field.kind as ProvableTypeString,
        value: field.value,
      })),
      createdAt: document.createdAt,
    };
  } else {
    return null;
  }
}

export async function createDocument(
  databaseName: string,
  collectionName: string,
  documentEncoded: DocumentEncoded,
  permissions: Permissions
): Promise<MerkleWitness> {
  const result = await createDocumentRequest(
    databaseName,
    collectionName,
    documentEncoded,
    permissions
  );

  if (result.isOne()) {
    const merkleWitness = result.unwrapObject();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function updateDocument(
  databaseName: string,
  collectionName: string,
  documentEncoded: DocumentEncoded,
  filter: FilterCriteria
): Promise<MerkleWitness> {
  const result = await updateDocumentRequest(
    databaseName,
    collectionName,
    JSON.parse(JSON.stringify(filter)),
    documentEncoded
  );

  if (result.isOne()) {
    const merkleWitness = result.unwrapObject();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function deleteDocument(
  databaseName: string,
  collectionName: string,
  filter: FilterCriteria
): Promise<MerkleWitness> {
  const result = await deleteDocumentRequest(
    databaseName,
    collectionName,
    JSON.parse(JSON.stringify(filter))
  );

  console.log('result', result);

  if (result.isOne()) {
    const merkleWitness = result.unwrapObject();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function findDocuments(
  databaseName: string,
  collectionName: string,
  filter: FilterCriteria,
  pagination?: Pagination
): Promise<Document[]> {
  const result = await findDocumentsRequest(
    databaseName,
    collectionName,
    JSON.parse(JSON.stringify(filter)),
    pagination
  );

  if (result.isSome()) {
    const documents = result.unwrapArray();

    return documents.map((document) => ({
      id: document.docId,
      documentEncoded: document.fields.map((field) => ({
        name: field.name,
        kind: field.kind as ProvableTypeString,
        value: field.value,
      })),
      createdAt: document.createdAt,
    }));
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}
