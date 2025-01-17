import {
  convertIndexToGraphqlFormat,
  convertIndexToMongoFormat,
} from '@helper';
import { ModelDocument, ModelMetadataCollection } from '@model';
import {
  EIndexProperty,
  TCollectionIndex,
  TCollectionIndexInfo,
  TCollectionMetadataRecord,
  TParamCollection,
  TPermissionSudo,
  TSchemaSerializedFieldDefinition,
} from '@zkdb/common';
import { Permission, PermissionBase } from '@zkdb/permission';
import { DATABASE_ENGINE, ModelCollection, ModelDatabase } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Group } from './group';
import { PermissionSecurity } from './permission-security';

export class Collection {
  public static async indexCreate(
    paramCollection: TPermissionSudo<TParamCollection>,
    collectionIndexList: TCollectionIndex[],
    session?: ClientSession
  ): Promise<boolean> {
    // Validate input parameters
    if (!collectionIndexList || collectionIndexList.length === 0) {
      throw new Error('Index is required and cannot be empty.');
    }
    const { databaseName, collectionName, sudo, actor } = paramCollection;

    // Check if the user has permission to create an index on this collection
    const metadataCollection = await ModelMetadataCollection.getInstance(
      databaseName
    ).getMetadata(collectionName, { session });

    if (!metadataCollection) {
      throw new Error(`Metadata not found for collection ${collectionName}`);
    }

    const actorPermission = await PermissionSecurity.collection(
      {
        databaseName,
        collectionName,
        actor,
        sudo: sudo || metadataCollection,
      },
      session
    );

    // Actor must have write permission of collection to create index
    if (actorPermission.write) {
      // Validate that all keys in the index exist in the schema
      const indexPossible = metadataCollection.schema.map(
        (schema) => schema.name
      );

      // CAUTION: Array.prototype.flat() required target es2020

      const flatCollectionIndexName = collectionIndexList
        .map((i) => Object.keys(i.index))
        .flat();

      // Using set to filter out duplicate
      // For example:
      /* 
         { index: { name: "Desc", old: "Asc" }, unique: true },
         { index: { name: "Asc" }, unique: false },
      */
      const invalidIndex = [...new Set(flatCollectionIndexName)].filter(
        (i) => !indexPossible.includes(i)
      );

      if (invalidIndex.length > 0) {
        const invalidList = invalidIndex.join(', ');
        throw new Error(
          `Invalid index fields: ${invalidList}. These fields are not part of the '${collectionName}' collection schema. Please ensure all index fields exist in the schema and are spelled correctly.`
        );
      }

      const imCollection = ModelCollection.getInstance(
        databaseName,
        DATABASE_ENGINE.serverless,
        collectionName
      );

      const listIndexPromise = collectionIndexList.map(
        async ({ index, unique }) => {
          const indexFormat = convertIndexToMongoFormat(index);
          const indexResult = await imCollection.index(indexFormat, {
            session,
            unique,
          });

          if (!indexResult) {
            throw new Error(
              `Cannot create index ${JSON.stringify(indexFormat)}`
            );
          }
          return indexResult;
        }
      );

      const result = await Promise.all(listIndexPromise);

      return result.every((e) => e === true);
    }

    throw new Error(
      `Access denied: Actor '${actor}' lacks 'system' permission to create indexes in the '${collectionName}' collection.`
    );
  }

  public static async indexList(
    paramCollection: TParamCollection,
    session?: ClientSession
  ): Promise<TCollectionIndexInfo[]> {
    const { databaseName, collectionName, actor } = paramCollection;
    const actorPermission = await PermissionSecurity.collection(
      paramCollection,
      session
    );
    if (actorPermission.read) {
      const imCollection = ModelCollection.getInstance(
        databaseName,
        DATABASE_ENGINE.serverless,
        collectionName
      );

      const stats = await imCollection.info();
      const indexSizes = stats.indexSizes || {};

      const indexUsageStats = await imCollection.collection
        .aggregate([{ $indexStats: {} }], { session })
        .toArray();

      const indexUsageMap: { [key: string]: any } = {};
      indexUsageStats.forEach((stat) => {
        if (stat.name !== undefined) {
          indexUsageMap[stat.name] = stat;
        }
      });

      const indexes = await imCollection.collection.indexes({ session });

      // const x = await imCollection.collection.listIndexes();
      const validIndexes = indexes.filter(
        (indexDef): indexDef is typeof indexDef & { name: string } =>
          indexDef.name !== undefined
      );

      const indexList: TCollectionIndexInfo[] = validIndexes.map((indexDef) => {
        const { name, key, unique } = indexDef;

        const size = indexSizes[name] || 0;
        const usageStats = indexUsageMap[name] || {};
        const access = usageStats.accesses?.ops || 0;
        const createdAt = usageStats.accesses?.since
          ? new Date(usageStats.accesses.since)
          : new Date(0);

        const property =
          Object.keys(key).length > 1
            ? EIndexProperty.Compound
            : EIndexProperty.Single;

        return {
          indexName: name,
          size,
          access,
          createdAt,
          property,
          index: convertIndexToGraphqlFormat(key),
          unique: unique || false,
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
      ).isIndexed(indexName, { session });
    }

    throw Error(
      `Access denied: Actor '${actor}' lacks 'read' permission to read indexes in the '${collectionName}' collection.`
    );
  }

  public static async indexDrop(
    paramCollection: TParamCollection,
    indexName: string,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, collectionName, actor } = paramCollection;
    const actorPermission = await PermissionSecurity.collection(
      paramCollection,
      session
    );
    if (actorPermission.system) {
      // TODO: Owner should able to drop
      if (await Collection.indexExist(paramCollection, indexName, session)) {
        return ModelCollection.getInstance(
          databaseName,
          DATABASE_ENGINE.serverless,
          collectionName
        ).dropIndex(indexName, { session });
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
    schema: TSchemaSerializedFieldDefinition[],
    groupName: string,
    permission: Permission,
    collectionIndex: TCollectionIndex[] | undefined,
    session: ClientSession
  ): Promise<boolean> {
    const { databaseName, collectionName, actor } = paramCollection;

    if (
      !(await PermissionSecurity.database({ databaseName, actor }, session))
        .system
    ) {
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

    // Check for duplicate field names in the schema
    const fieldNames = schema.map((field) => field.name);
    const duplicateFields = fieldNames.filter(
      (name, index) => fieldNames.indexOf(name) !== index
    );
    if (duplicateFields.length > 0) {
      throw new Error(
        `Schema contains duplicate field names: ${duplicateFields.join(', ')}`
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
        owner: actor,
        group: groupName,
        permission: permission.value,
        createdAt: new Date(),
        updatedAt: new Date(),
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

    if (collectionIndex && collectionIndex.length > 0) {
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
    const listCollectionMetadata = (
      await ModelMetadataCollection.getInstance(databaseName).find().toArray()
    ).map(async (metadata) => ({
      ...metadata,
      sizeOnDisk: await ModelCollection.getInstance(
        databaseName,
        DATABASE_ENGINE.serverless,
        metadata.collectionName
      ).size(),
    }));

    return PermissionSecurity.filterMetadataCollection(
      databaseName,
      await Promise.all(listCollectionMetadata),
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
