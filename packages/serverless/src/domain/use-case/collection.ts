import { ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { DocumentSchemaInput } from '../types/schema.js';
import { Permissions } from '../types/permission.js';
import logger from '../../helper/logger.js';
import { createCollectionMetadata } from './collection-metadata.js';
import { isGroupExist } from './group.js';
import { hasCollectionPermission } from './permission.js';
import { Collection } from '../types/collection.js';
import { getSchemaDefinition } from './schema.js';
import { readMetadata } from './metadata.js';
import { ZKDATABASE_USER_NOBODY } from '../../common/const.js';

async function createCollection(
  databaseName: string,
  collectionName: string,
  actor: string,
  groupName: string,
  schema: DocumentSchemaInput,
  permissions: Permissions,
  session?: ClientSession
): Promise<boolean> {
  const modelDatabase = ModelDatabase.getInstance(databaseName);

  if (await modelDatabase.isCollectionExist(collectionName)) {
    throw Error(
      `Collection ${collectionName} already exist in database ${databaseName}`
    );
  }

  if (!(await isGroupExist(databaseName, groupName, session))) {
    throw Error(
      `Group ${groupName} does not exist in database ${databaseName}`
    );
  }

  try {
    await modelDatabase.createCollection(collectionName);
    await createCollectionMetadata(
      databaseName,
      collectionName,
      schema,
      permissions,
      actor,
      groupName,
      session
    );
    return true;
  } catch (error) {
    await modelDatabase.dropCollection(collectionName);
    logger.error(error);
    throw error;
  }
}

async function readCollectionInfo(
  databaseName: string,
  collectionName: string
): Promise<Collection> {
  const indexes = await ModelCollection.getInstance(
    databaseName,
    collectionName
  ).listIndexes();
  const schema = await getSchemaDefinition(databaseName, collectionName);
  const ownership = await readMetadata(
    databaseName,
    collectionName,
    null,
    ZKDATABASE_USER_NOBODY
  );

  return { name: collectionName, indexes, schema, ownership };
}

async function listCollections(databaseName: string): Promise<Collection[]> {
  const collectionNames =
    await ModelDatabase.getInstance(databaseName).listCollections();

  const collections: Collection[] = await Promise.all(
    collectionNames.map((collectionName) =>
      readCollectionInfo(databaseName, collectionName)
    )
  );
  return collections;
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

export async function collectionExist(
  databaseName: string,
  collectionName: string
): Promise<boolean> {
  return (await ModelDatabase.getInstance(databaseName).listCollections()).some(
    (collection) => collection === collectionName
  );
}

export {
  createCollection,
  createIndex,
  dropIndex,
  listIndexes,
  doesIndexExist,
  listCollections,
  readCollectionInfo,
};
