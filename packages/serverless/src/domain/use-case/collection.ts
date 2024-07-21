import { ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { DocumentSchema } from '../types/schema';
import { Permissions } from '../types/permission';
import logger from '../../helper/logger';
import { createCollectionMetadata } from './collection-metadata';
import { createGroup } from './group';
import { hasCollectionPermission } from './permission';

async function createCollection(
  databaseName: string,
  collectionName: string,
  owner: string,
  group: string,
  schema: DocumentSchema,
  permissions: Permissions,
  groupDescription?: string,
  session?: ClientSession
): Promise<boolean> {
  const modelDatabase = ModelDatabase.getInstance(databaseName);

  if (await modelDatabase.isCollectionExist(collectionName)) {
    throw Error(
      `Collection ${collectionName}already exist in database ${databaseName}`
    );
  }

  try {
    await modelDatabase.createCollection(collectionName);

    const isGroupCreated = await createGroup(
      databaseName,
      owner,
      group,
      groupDescription,
      session
    );

    if (!isGroupCreated) {
      throw Error('Failed to create a group');
    }

    await createCollectionMetadata(
      databaseName,
      collectionName,
      schema,
      permissions,
      owner,
      group,
      session
    );

    return true;
  } catch (error) {
    await modelDatabase.dropCollection(collectionName);
    logger.error(error);
    return false;
  }
}

async function listIndexes(
  databaseName: string,
  actor: string,
  collectionName: string,
  session?: ClientSession
): Promise<string[]> {
  if (
    await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    )
  ) {
    // TODO: Should we check if index fields exist for a collection
    return ModelCollection.getInstance(
      databaseName,
      collectionName
    ).listIndexes();
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
  );
}

async function doesIndexExist(
  databaseName: string,
  actor: string,
  collectionName: string,
  indexName: string,
  session?: ClientSession
): Promise<boolean> {
  if (
    await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    )
  ) {
    // TODO: Should we check if index fields exist for a collection
    return ModelCollection.getInstance(databaseName, collectionName).isIndexed(
      indexName
    );
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
  );
}

async function createIndex(
  databaseName: string,
  actor: string,
  collectionName: string,
  indexNames: string[],
  session?: ClientSession
): Promise<boolean> {
  if (
    await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'system',
      session
    )
  ) {
    // TODO: Should we check if index fields exist for a collection
    return ModelCollection.getInstance(databaseName, collectionName).index(
      indexNames || [],
      { session }
    );
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'system' permission to create indexes in the '${collectionName}' collection.`
  );
}

async function dropIndex(
  databaseName: string,
  actor: string,
  collectionName: string,
  indexName: string,
  session?: ClientSession
): Promise<boolean> {
  if (
    await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'system',
      session
    )
  ) {
    // TODO: Should we check if index fields exist for a collection
    return ModelCollection.getInstance(databaseName, collectionName).dropIndex(
      indexName,
      { session }
    );
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'system' permission to drop indexes in the '${collectionName}' collection.`
  );
}

export { createCollection, createIndex, dropIndex, listIndexes, doesIndexExist };
