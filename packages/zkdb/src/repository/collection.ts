import { SchemaDefinition } from '../sdk/schema.js';
import { Permissions } from '../types/permission.js';
import { AppContainer } from '../container.js';

export async function listCollectionIndexes(
  databaseName: string,
  collectionName: string
): Promise<string[]> {
  const result = await AppContainer.getInstance().getApiClient().index.list({
    databaseName,
    collectionName,
  });

  return result.unwrap();
}

export async function dropCollectionIndex(
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<boolean> {
  const result = await AppContainer.getInstance().getApiClient().index.delete({
    databaseName,
    collectionName,
    indexName,
  });

  return result.unwrap();
}

export async function createCollectionIndexes(
  databaseName: string,
  collectionName: string,
  indexes: string[]
): Promise<boolean> {
  const result = await AppContainer.getInstance().getApiClient().index.create({
    databaseName,
    collectionName,
    indexes,
  });

  return result.unwrap();
}

export async function createCollection(
  databaseName: string,
  collectionName: string,
  groupName: string,
  documentEncoded: SchemaDefinition,
  permissions: Permissions
) {
  const result = await AppContainer.getInstance().getApiClient().collection.create({
    databaseName,
    collectionName,
    groupName,
    schema: documentEncoded,
    permissions,
  });

  return result.unwrap();
}
