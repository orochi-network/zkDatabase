import { ModelCollection, ModelDatabase } from '@zkdb/storage';
import { Fill } from '@orochi-network/queue';
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
import { CollectionIndex } from '../types/collection-index.js';

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

  await modelDatabase.createCollection(collectionName, session);
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
}

async function readCollectionInfo(
  databaseName: string,
  collectionName: string
): Promise<Collection> {
  const modelCollection = ModelCollection.getInstance(
    databaseName,
    collectionName
  );
  const indexes = await modelCollection.listIndexes();
  const sizeOnDisk = await modelCollection.size();

  const schema = await getSchemaDefinition(databaseName, collectionName);
  const ownership = await readMetadata(
    databaseName,
    collectionName,
    null,
    ZKDATABASE_USER_NOBODY
  );

  await ModelCollection.getInstance(databaseName, collectionName).size();

  return { name: collectionName, indexes, schema, ownership, sizeOnDisk };
}

async function listCollections(databaseName: string): Promise<Collection[]> {
  const collectionNames =
    await ModelDatabase.getInstance(databaseName).listCollections();

  return (
    await Fill(
      collectionNames.map(
        (collectionName) => async () =>
          readCollectionInfo(databaseName, collectionName)
      )
    )
  ).map(({ result }) => result);
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

export async function listIndexesInfo(
  databaseName: string,
  collectionName: string,
  actor: string
): Promise<CollectionIndex[]> {
  if (
    await hasCollectionPermission(databaseName, collectionName, actor, 'read')
  ) {
    const modelCollection = ModelCollection.getInstance(
      databaseName,
      collectionName
    );

    const stats = await modelCollection.info();
    const indexSizes = stats.indexSizes || {};

    const indexUsageStats = await modelCollection.collection
      .aggregate([{ $indexStats: {} }])
      .toArray();

    const indexUsageMap: { [key: string]: any } = {};
    indexUsageStats.forEach((stat) => {
      if (stat.name !== undefined) {
        indexUsageMap[stat.name] = stat;
      }
    });

    const indexes = await modelCollection.collection.indexes();

    const validIndexes = indexes.filter(
      (indexDef): indexDef is typeof indexDef & { name: string } =>
        indexDef.name !== undefined
    );

    const indexList: CollectionIndex[] = validIndexes.map((indexDef) => {
      const { name } = indexDef;
      const size = indexSizes[name] || 0;
      const usageStats = indexUsageMap[name] || {};
      const accesses = usageStats.accesses?.ops || 0;
      const since = usageStats.accesses?.since
        ? new Date(usageStats.accesses.since)
        : new Date(0);

      return {
        name,
        size,
        accesses,
        since,
      };
    });

    return indexList;
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
  indexNames: string[]
): Promise<boolean> {
  if (
    await hasCollectionPermission(databaseName, collectionName, actor, 'system')
  ) {
    // TODO: Should we check if index fields exist for a collection
    return ModelCollection.getInstance(databaseName, collectionName).index(
      indexNames || []
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
  indexName: string
): Promise<boolean> {
  if (
    await hasCollectionPermission(databaseName, collectionName, actor, 'system')
  ) {
    // TODO: Allow people to choose the sorting order
    const index = `${indexName}_1`;
    if (await doesIndexExist(databaseName, actor, collectionName, index)) {
      return ModelCollection.getInstance(
        databaseName,
        collectionName
      ).dropIndex(index);
    }

    throw Error(
      `Index '${indexName}' does not exist on ${databaseName}/${collectionName}`
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
