import {
  createIndexes,
  deleteIndex,
  listIndexes,
  createCollection as createCollectionRequest,
} from '@zkdb/api';
import { DocumentEncoded, SchemaDefinition } from '../sdk/schema.js';
import { Permissions } from '../types/permission.js';

export async function listCollectionIndexes(
  databaseName: string,
  collectionName: string
): Promise<string[]> {
  const result = await listIndexes(databaseName, collectionName);

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function dropCollectionIndex(
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<boolean> {
  const result = await deleteIndex(databaseName, collectionName, indexName);

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function createCollectionIndexes(
  databaseName: string,
  collectionName: string,
  indexNames: string[]
): Promise<boolean> {
  const result = await createIndexes(databaseName, collectionName, indexNames);

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function createCollection(
  databaseName: string,
  collectionName: string,
  groupName: string,
  documentEncoded: SchemaDefinition,
  permissions: Permissions
) {
  const result =  await createCollectionRequest(
    databaseName,
    collectionName,
    groupName,
    documentEncoded,
    permissions
  );

  if (result.type === 'error') {
    throw Error(result.message)
  } 
}
