import { Fill } from '@orochi-network/queue';
import { Permission } from '@zkdb/permission';
import { DB, ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ModelMetadataCollection } from 'model/database/metadata-collection.js';
import { ClientSession } from 'mongodb';
import {
  DEFAULT_GROUP_ADMIN,
  PERMISSION_DEFAULT_VALUE,
} from '../../common/const.js';
import { getIndexCollectionBySchemaDefinition } from '../../helper/common.js';
import ModelUserGroup from '../../model/database/user-group.js';

import { createCollectionMetadata } from './collection-metadata.js';
import { isDatabaseOwner } from './database.js';
import { isGroupExist } from './group.js';
import { readCollectionMetadata } from './metadata.js';
import { hasCollectionPermission } from './permission.js';
import { getSchemaDefinition } from './schema.js';
import {
  EProperty,
  ESorting,
  TCollectionDetail,
  TCollectionIndex,
  TCollectionIndexInfo,
  TSchemaFieldDefinition,
} from '@zkdb/common';

async function createIndex(
  databaseName: string,
  actor: string,
  collectionName: string,
  index: TCollectionIndex[]
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
    const invalidIndexes = index
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

    return ModelCollection.getInstance(
      databaseName,
      DB.service,
      collectionName
    ).index(
      index.map((i) => ({
        [`${i.name}.name`]: i.sorting === ESorting.Asc ? 1 : -1,
      }))
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
  schema: TSchemaFieldDefinition[],
  groupName = DEFAULT_GROUP_ADMIN,
  permission = PERMISSION_DEFAULT_VALUE,
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
    permission,
    actor,
    groupName,
    session
  );

  // Create index by schema definition
  const collectionIndex = getIndexCollectionBySchemaDefinition(schema);

  if (collectionIndex.length > 0) {
    await createIndex(databaseName, actor, collectionName, collectionIndex);
  }

  return true;
}

async function readCollectionInfo(
  databaseName: string,
  collectionName: string,
  actor: string,
  skipPermissionCheck: boolean = false
): Promise<TCollectionDetail> {
  if (
    skipPermissionCheck ||
    (await hasCollectionPermission(databaseName, collectionName, actor, 'read'))
  ) {
    const modelCollection = ModelCollection.getInstance(
      databaseName,
      DB.service,
      collectionName
    );

    const sizeOnDisk = await modelCollection.size();

    const schema = await getSchemaDefinition(
      databaseName,
      collectionName,
      actor,
      true
    );

    const metadata = await readCollectionMetadata(
      databaseName,
      collectionName,
      actor
    );

    if (!metadata) {
      throw new Error(
        `Cannot find metadata collection of ${collectionName} in database ${databaseName}`
      );
    }
    const index = getIndexCollectionBySchemaDefinition(metadata.definition);

    await ModelCollection.getInstance(
      databaseName,
      DB.service,
      collectionName
    ).size();

    return {
      collectionName,
      index,
      metadata,
      sizeOnDisk,
    };
  }

  throw new Error(
    `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
  );
}

async function listCollections(
  databaseName: string,
  actor: string
): Promise<TCollectionDetail[]> {
  let availableCollections: string[] = [];

  if (await isDatabaseOwner(databaseName, actor)) {
    availableCollections =
      await ModelDatabase.getInstance(databaseName).listCollections();
  } else {
    const collectionsMetadata = await (
      await ModelMetadataCollection.getInstance(databaseName).find()
    ).toArray();

    const modelUserGroup = new ModelUserGroup(databaseName);

    const actorGroups = await modelUserGroup.listGroupByUserName(actor);

    for (const metadata of collectionsMetadata) {
      const permission = Permission.from(metadata.permission);
      if (
        (metadata.owner === actor && permission.owner.read) ||
        (actorGroups.includes(metadata.group) && permission.group.read) ||
        permission.other.read
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
      DB.service,
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
): Promise<TCollectionIndexInfo[]> {
  if (
    await hasCollectionPermission(databaseName, collectionName, actor, 'read')
  ) {
    const modelCollection = ModelCollection.getInstance(
      databaseName,
      DB.service,
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

    const indexList: TCollectionIndexInfo[] = validIndexes.map((indexDef) => {
      const { name, key } = indexDef;
      const size = indexSizes[name] || 0;
      const usageStats = indexUsageMap[name] || {};
      const access = usageStats.accesses?.ops || 0;
      const since = usageStats.accesses?.since
        ? new Date(usageStats.accesses.since)
        : new Date(0);
      const property =
        Object.keys(key).length > 1 ? EProperty.Compound : EProperty.Unique;
      return {
        name,
        size,
        access,
        since,
        property,
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
    return ModelCollection.getInstance(
      databaseName,
      DB.service,
      collectionName
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
  indexName: string
): Promise<boolean> {
  if (
    await hasCollectionPermission(databaseName, collectionName, actor, 'system')
  ) {
    // TODO: Allow people to choose the sorting order
    if (await doesIndexExist(databaseName, actor, collectionName, indexName)) {
      return ModelCollection.getInstance(
        databaseName,
        DB.service,
        collectionName
      ).dropIndex(indexName);
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
