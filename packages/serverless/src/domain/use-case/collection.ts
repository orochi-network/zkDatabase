import {
  EProperty,
  PERMISSION_DEFAULT,
  TCollectionIndexInfo,
  TCollectionIndexMap,
  TCollectionMetadataRecord,
  TParamCollection,
  TPermissionSudo,
  TSchemaFieldDefinition,
} from '@zkdb/common';
import { Permission, PermissionBase } from '@zkdb/permission';
import { DATABASE_ENGINE, ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ModelDocument, ModelMetadataCollection } from '@model';
import { ClientSession } from 'mongodb';
import { GROUP_DEFAULT_ADMIN } from '@common';
import { convertSchemaDefinitionToIndex, getCurrentTime } from '@helper';
import { Group } from './group';
import { PermissionSecurity } from './permission-security';

export class Collection {
  public static async indexCreate(
    paramCollection: TPermissionSudo<TParamCollection>,
    index: TCollectionIndexMap,
    session?: ClientSession
  ): Promise<boolean> {
    // Validate input parameters
    if (!index || Object.keys(index).length === 0) {
      throw new Error('Index is required and cannot be empty.');
    }
    const { databaseName, collectionName, sudo, actor } = paramCollection;

    // Check if the user has permission to create an index on this collection
    const metadataCollection = await ModelMetadataCollection.getInstance(
      databaseName
    ).getMetadata(collectionName, { session });

    if (!metadataCollection?.metadata) {
      throw new Error(`Metadata not found for collection ${collectionName}`);
    }
    const actorPermission = await PermissionSecurity.collection(
      {
        databaseName,
        collectionName,
        actor,
        sudo: sudo || metadataCollection.metadata,
      },
      session
    );

    // Actor must have write permission of collection to create index
    if (actorPermission.write) {
      // Validate that all keys in the index exist in the schema
      const indexPossible = metadataCollection.schema.map(
        (e) => `document.${e.name}.value`
      );

      const invalidIndex = Object.keys(index).filter(
        (i) => !indexPossible.includes(i)
      );

      if (invalidIndex.length > 0) {
        const invalidList = invalidIndex.join(', ');
        throw new Error(
          `Invalid index fields: ${invalidList}. These fields are not part of the '${collectionName}' collection schema. Please ensure all index fields exist in the schema and are spelled correctly.`
        );
      }

      // Create the index using ModelCollection
      const result = ModelCollection.getInstance(
        databaseName,
        DATABASE_ENGINE.serverless,
        collectionName
      ).index(index, { session });

      return result;
    }

    throw new Error(
      `Access denied: Actor '${actor}' lacks 'system' permission to create indexes in the '${collectionName}' collection.`
    );
  }

  public static async indexList(
    paramCollection: TParamCollection
  ): Promise<TCollectionIndexInfo[]> {
    const { databaseName, collectionName, actor } = paramCollection;
    const actorPermission =
      await PermissionSecurity.collection(paramCollection);
    if (actorPermission.read) {
      const modelCollection = ModelCollection.getInstance(
        databaseName,
        DATABASE_ENGINE.serverless,
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
        const createdAt = usageStats.accesses?.since
          ? new Date(usageStats.accesses.since)
          : new Date(0);
        const property =
          Object.keys(key).length > 1 ? EProperty.Compound : EProperty.Unique;
        return {
          indexName: name,
          size,
          access,
          createdAt,
          property,
        };
      });

      return indexList;
    }

    throw Error(
      `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
    );
  }

  public static async indexExist(
    paramCollection: TParamCollection,
    indexName: string,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, collectionName, actor } = paramCollection;
    const actorPermission = await PermissionSecurity.collection(
      paramCollection,
      session
    );
    if (actorPermission.read) {
      return ModelCollection.getInstance(
        databaseName,
        DATABASE_ENGINE.serverless,
        collectionName
      ).isIndexed(indexName);
    }

    throw Error(
      `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
    );
  }

  public static async indexDrop(
    paramCollection: TParamCollection,
    indexName: string
  ): Promise<boolean> {
    const { databaseName, collectionName, actor } = paramCollection;
    const actorPermission =
      await PermissionSecurity.collection(paramCollection);
    if (actorPermission.system) {
      // TODO: Owner should able to drop
      if (await Collection.indexExist(paramCollection, indexName)) {
        return ModelCollection.getInstance(
          databaseName,
          DATABASE_ENGINE.serverless,
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

  public static async create(
    paramCollection: TParamCollection,
    schema: TSchemaFieldDefinition[],
    groupName: string,
    permission: Permission,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, collectionName, actor } = paramCollection;

    if (!(await PermissionSecurity.database({ databaseName, actor })).system) {
      throw new Error(
        `Access denied: Actor '${actor}' lacks 'system' permission to create collections in the '${databaseName}' database.`
      );
    }

    // Get system database
    const modelDatabase = ModelDatabase.getInstance(databaseName);

    if (await modelDatabase.isCollectionExist(collectionName)) {
      throw Error(
        `Collection ${collectionName} already exist in database ${databaseName}`
      );
    }

    if (!(await Group.exist({ databaseName, groupName }, session))) {
      throw Error(
        `Group ${groupName} does not exist in database ${databaseName}`
      );
    }

    if (!(await modelDatabase.createCollection(collectionName, session))) {
      throw new Error(`Failed to create collection ${collectionName}`);
    }

    // Create metadata collection
    const resultInsertMetadata = await ModelMetadataCollection.getInstance(
      databaseName
    ).insertOne(
      {
        collectionName,
        schema,
        metadata: {
          owner: actor,
          group: groupName,
          permission: permission.value,
        },
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      {
        session,
      }
    );

    if (!resultInsertMetadata.acknowledged) {
      throw new Error(
        `Failed to insert metadata for collection ${collectionName}`
      );
    }

    // Create built-in indexes
    await ModelDocument.init(databaseName, collectionName, session);

    // Create index by schema definition
    const collectionIndex = convertSchemaDefinitionToIndex(schema);

    if (Object.keys(collectionIndex).length > 0) {
      const result = await Collection.indexCreate(
        { databaseName, actor, collectionName },
        collectionIndex,
        session
      );
      return result;
    }

    return true;
  }

  public static async list(
    databaseName: string,
    actor: string,
    session?: ClientSession
  ): Promise<TCollectionMetadataRecord[]> {
    const lisTCollectionMetadata = await ModelMetadataCollection.getInstance(
      databaseName
    )
      .find()
      .toArray();

    return PermissionSecurity.filterMetadataCollection(
      databaseName,
      lisTCollectionMetadata,
      actor,
      PermissionBase.permissionRead(),
      session
    );
  }

  public static async exist(
    databaseName: string,
    collectionName: string
  ): Promise<boolean> {
    return (
      await ModelDatabase.getInstance(databaseName).listCollections()
    ).some((collection) => collection === collectionName);
  }
}

export default { Collection };
