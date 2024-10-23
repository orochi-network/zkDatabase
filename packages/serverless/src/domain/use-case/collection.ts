import { Fill } from '@orochi-network/queue';
import { ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { ZKDATABASE_USER_NOBODY } from '../../common/const.js';
import {
  CollectionIndex,
  CollectionIndexInfo,
} from '../types/collection-index.js';
import { Collection } from '../types/collection.js';
import { Permissions } from '../types/permission.js';
import { DocumentSchemaInput } from '../types/schema.js';
import { createCollectionMetadata } from './collection-metadata.js';
import { isGroupExist } from './group.js';
import { readMetadata } from './metadata.js';
import { hasCollectionPermission } from './permission.js';
import { getSchemaDefinition } from './schema.js';
import { Sorting } from '../types/sorting.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import { isDatabaseOwner } from './database.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { PermissionBinary } from '../../common/permission.js';

function mapSorting(sorting: Sorting): 1 | -1 {
  return sorting === 'ASC' ? 1 : -1;
}

async function createIndex(
  databaseName: string,
  actor: string,
  collectionName: string,
  indexes: CollectionIndex[]
): Promise<boolean> {
  if (
    await hasCollectionPermission(databaseName, collectionName, actor, 'system')
  ) {
    const schema = await getSchemaDefinition(
      databaseName,
      collectionName,
      actor,
      true
    );

    // Collect all invalid index names
    const invalidIndexes = indexes
      .map(({ name }) => name)
      .filter(
        (name) => !schema.some(({ name: fieldName }) => fieldName === name)
      );

    if (invalidIndexes.length > 0) {
      const invalidList = invalidIndexes.join(', ');
      throw new Error(
        `Invalid index fields: ${invalidList}. These fields are not part of the '${collectionName}' collection schema. Please ensure all index fields exist in the schema and are spelled correctly.`
      );
    }

    return ModelCollection.getInstance(databaseName, collectionName).index(
      indexes.map((index) => ({ [index.name]: mapSorting(index.sorting) }))
    );
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
  collectionName: string,
  actor: string,
  skipPermissionCheck: boolean = false
): Promise<Collection> {
  if (
    skipPermissionCheck ||
    (await hasCollectionPermission(databaseName, collectionName, actor, 'read'))
  ) {
    const modelCollection = ModelCollection.getInstance(
      databaseName,
      collectionName
    );
    const indexes = await modelCollection.listIndexes();
    const sizeOnDisk = await modelCollection.size();

    const schema = await getSchemaDefinition(
      databaseName,
      collectionName,
      actor,
      true
    );

    const ownership = await readMetadata(
      databaseName,
      collectionName,
      null,
      actor
    );

    await ModelCollection.getInstance(databaseName, collectionName).size();

    return { name: collectionName, indexes, schema, ownership, sizeOnDisk };
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

async function listCollections(
  databaseName: string,
  actor: string
): Promise<Collection[]> {
  let availableCollections: string[] = [];

  if (await isDatabaseOwner(databaseName, actor)) {
    availableCollections =
      await ModelDatabase.getInstance(databaseName).listCollections();
  } else {
    const collectionsMetadata = await (
      await ModelCollectionMetadata.getInstance(databaseName).find()
    ).toArray();

    const modelUserGroup = new ModelUserGroup(databaseName);

    const actorGroups = await modelUserGroup.listGroupByUserName(actor);

    for (const metadata of collectionsMetadata) {
      if (
        (metadata.owner === actor &&
          PermissionBinary.fromBinaryPermission(metadata.permissionOwner)[
            'read'
          ]) ||
        (actorGroups.includes(metadata.group) &&
          PermissionBinary.fromBinaryPermission(metadata.permissionGroup)[
            'read'
          ]) ||
        PermissionBinary.fromBinary(metadata.permissionOther)['read']
      ) {
        availableCollections.push(metadata.collection);
      }
    }
  }

  return (
    await Fill(
      availableCollections.map(
        (collectionName) => async () =>
          readCollectionInfo(databaseName, collectionName, actor, true)
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
  skipPermissionCheck: boolean = false,
  session?: ClientSession
): Promise<string[]> {
  if (
    skipPermissionCheck ||
    (await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    ))
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
): Promise<CollectionIndexInfo[]> {
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
    await modelCollection.collection.indexInformation();
    const validIndexes = indexes.filter(
      (indexDef): indexDef is typeof indexDef & { name: string } =>
        indexDef.name !== undefined
    );

    const indexList: CollectionIndexInfo[] = validIndexes.map((indexDef) => {
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
  doesIndexExist,
  dropIndex,
  listCollections,
  listIndexes,
  readCollectionInfo,
};
