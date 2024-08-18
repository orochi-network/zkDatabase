import { Permissions } from '../types/permission.js';
import { DocumentEncoded, ProvableTypeString } from '../sdk/schema.js';
import { MerkleWitness } from '../types/merkle-tree.js';
import {
  createDocument as createDocumentRequest,
  updateDocument as updateDocumentRequest,
  deleteDocument as deleteDocumentRequest,
  findDocument as findDocumentRequest,
  searchDocument as searchDocumentRequest,
} from '@zkdb/api';
import { Field } from 'o1js';
import { FilterCriteria } from '../types/common.js';
import { QueryOptions } from '../sdk/query/builder/query-builder.js';
import mapSearchInputToSearch from './mapper/search.js';

export async function findDocument(
  databaseName: string,
  collectionName: string,
  filter: FilterCriteria
): Promise<{ id: string; documentEncoded: DocumentEncoded } | null> {
  const result = await findDocumentRequest(
    databaseName,
    collectionName,
    JSON.parse(JSON.stringify(filter))
  );

  if (result.type === 'success') {
    return {
      id: result.data._id,
      documentEncoded: result.data.document.map((field) => ({
        name: field.name,
        kind: field.kind as ProvableTypeString,
        value: field.value,
      })),
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

  if (result.type === 'success') {
    return result.data.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    throw Error(result.message);
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

  if (result.type === 'success') {
    return result.data.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    throw Error(result.message);
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

  if (result.type === 'success') {
    return result.data.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  } else {
    throw Error(result.message);
  }
}

export async function searchDocument(
  databaseName: string,
  collectionName: string,
  queryOptions?: QueryOptions<any>
): Promise<Array<{ id: string; documentEncoded: DocumentEncoded }>> {
  const result = await searchDocumentRequest(
    databaseName,
    collectionName,
    queryOptions ? mapSearchInputToSearch(queryOptions.where) : undefined,
    queryOptions?.limit
      ? {
          limit: queryOptions.limit,
          offset: queryOptions.offset ?? 0,
        }
      : undefined
  );

  if (result.type === 'success') {
    return result.data.map((document) => ({
      id: document._id,
      documentEncoded: document.document.map((field) => ({
        name: field.name,
        kind: field.kind as ProvableTypeString,
        value: field.value,
      })),
    }));
  } else {
    throw Error(result.message);
  }
}
