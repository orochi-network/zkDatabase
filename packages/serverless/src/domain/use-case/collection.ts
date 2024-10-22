import { Fill } from '@orochi-network/queue';
import { ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { ZKDATABASE_USER_NOBODY } from '../../common/const.js';
import { CollectionIndex } from '../types/collection-index.js';
import { Collection } from '../types/collection.js';
import { Permissions } from '../types/permission.js';
import { DocumentSchemaInput } from '../types/schema.js';
import { createCollectionMetadata } from './collection-metadata.js';
import { isGroupExist } from './group.js';
import { readMetadata } from './metadata.js';
import { hasCollectionPermission } from './permission.js';
import { getSchemaDefinition } from './schema.js';
import { NetworkId } from '../types/network.js';

async function createIndex(
  networkId: NetworkId,
  databaseName: string,
  actor: string,
  collectionName: string,
  indexNames: string[]
): Promise<boolean> {
  if (
    await hasCollectionPermission(
      networkId,
      databaseName,
      collectionName,
      actor,
      'system'
    )
  ) {
    // TODO: Should we check if index fields exist for a collection
    return ModelCollection.getInstance(
      databaseName,
      collectionName,
      networkId
    ).index(indexNames || []);
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'system' permission to create indexes in the '${collectionName}' collection.`
  );
}

async function createCollection(
  databaseName: string,
  collectionName: string,
  actor: string,
  groupName: string,
  schema: DocumentSchemaInput,
  permissions: Permissions,
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  const modelDatabase = ModelDatabase.getInstance(databaseName, networkId);

  if (await modelDatabase.isCollectionExist(collectionName)) {
    throw Error(
      `Collection ${collectionName} already exist in database ${databaseName}`
    );
  }

  if (!(await isGroupExist(databaseName, groupName, networkId, session))) {
    throw Error(
      `Group ${groupName} does not exist in database ${databaseName}`
    );
  }

  await modelDatabase.createCollection(collectionName, session);

  await createCollectionMetadata(
    networkId,
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
  collectionName: string,
  actor: string,
  networkId: NetworkId
): Promise<Collection> {
  const modelCollection = ModelCollection.getInstance(
    databaseName,
    collectionName,
    networkId
  );
  const indexes = await modelCollection.listIndexes();
  const sizeOnDisk = await modelCollection.size();

  const schema = await getSchemaDefinition(
    networkId,
    databaseName,
    collectionName
  );
  const ownership = await readMetadata(
    networkId,
    databaseName,
    collectionName,
    null,
    actor
  );

  await ModelCollection.getInstance(
    databaseName,
    collectionName,
    networkId
  ).size();

  return { name: collectionName, indexes, schema, ownership, sizeOnDisk };
}

async function listCollections(
  databaseName: string,
  actor: string,
  networkId: NetworkId
): Promise<Collection[]> {
  const collectionNames = await ModelDatabase.getInstance(
    databaseName,
    networkId
  ).listCollections();

  return (
    await Fill(
      collectionNames.map(
        (collectionName) => async () =>
          readCollectionInfo(databaseName, collectionName, actor, networkId)
      )
    )
  )
    .map(({ result }) => result)
    .filter(Boolean);
}

async function listIndexes(
  databaseName: string,
  actor: string,
  collectionName: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<string[]> {
  if (
    await hasCollectionPermission(
      networkId,
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
      collectionName,
      networkId
    ).listIndexes();
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
  );
}
export async function listIndexesInfo(
  databaseName: string,
  collectionName: string,
  actor: string,
  networkId: NetworkId
): Promise<CollectionIndex[]> {
  if (
    await hasCollectionPermission(
      networkId,
      databaseName,
      collectionName,
      actor,
      'read'
    )
  ) {
    const modelCollection = ModelCollection.getInstance(
      databaseName,
      collectionName,
      networkId
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
    await modelCollection.collection.indexInformation();
    const validIndexes = indexes.filter(
      (indexDef): indexDef is typeof indexDef & { name: string } =>
        indexDef.name !== undefined
    );

    const indexList: CollectionIndex[] = validIndexes.map((indexDef) => {
      const { name, key } = indexDef;
      const size = indexSizes[name] || 0;
      const usageStats = indexUsageMap[name] || {};
      const accesses = usageStats.accesses?.ops || 0;
      const since = usageStats.accesses?.since
        ? new Date(usageStats.accesses.since)
        : new Date(0);
      const properties = Object.keys(key).length > 1 ? 'compound' : 'unique';
      return {
        name,
        size,
        accesses,
        since,
        properties,
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
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  if (
    await hasCollectionPermission(
      networkId,
      databaseName,
      collectionName,
      actor,
      'read',
      session
    )
  ) {
    return ModelCollection.getInstance(
      databaseName,
      collectionName,
      networkId
    ).isIndexed(indexName);
  }

  throw Error(
    `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
  );
}

async function dropIndex(
  databaseName: string,
  actor: string,
  collectionName: string,
  indexName: string,
  networkId: NetworkId
): Promise<boolean> {
  if (
    await hasCollectionPermission(
      networkId,
      databaseName,
      collectionName,
      actor,
      'system'
    )
  ) {
    // TODO: Allow people to choose the sorting order
    const index = `${indexName}_1`;
    if (
      await doesIndexExist(
        databaseName,
        actor,
        collectionName,
        index,
        networkId
      )
    ) {
      return ModelCollection.getInstance(
        databaseName,
        collectionName,
        networkId
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
  collectionName: string,
  networkId: NetworkId
): Promise<boolean> {
  return (
    await ModelDatabase.getInstance(databaseName, networkId).listCollections()
  ).some((collection) => collection === collectionName);
}

export {
  createCollection,
  createIndex,
  doesIndexExist,
  dropIndex,
  listCollections,
  listIndexes,
  readCollectionInfo,
};
