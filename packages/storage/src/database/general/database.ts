import { zkDatabaseConstant, zkDatabaseMetadataCollections } from '@common';
import { DATABASE_ENGINE } from '@helper';
import {
  ClientSession,
  DbStatsOptions,
  Document,
  DropDatabaseOptions,
  ListCollectionsOptions,
  ListDatabasesResult,
} from 'mongodb';
import { ModelBasic } from '../base';

/**
 * Handles database operations. Extends ModelBasic.
 * This class should not be used directly.
 */
export class ModelDatabase<T extends Document> extends ModelBasic<T> {
  private static instances: Map<string, ModelDatabase<any>> = new Map();

  constructor(databaseName?: string) {
    super(
      databaseName || zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless
    );
  }

  public static getInstance<T extends Document>(
    databaseName: string
  ): ModelDatabase<T> {
    if (!ModelDatabase.instances.has(databaseName)) {
      ModelDatabase.instances.set(
        databaseName,
        new ModelDatabase<T>(databaseName)
      );
    }
    return ModelDatabase.instances.get(databaseName) as ModelDatabase<T>;
  }

  public async listCollections(
    filter?: Document,
    options?: ListCollectionsOptions
  ): Promise<string[]> {
    const collections = await this.db
      .listCollections(filter, options)
      .toArray();
    return collections
      .filter(
        (collection) => !zkDatabaseMetadataCollections.includes(collection.name)
      )
      .map((collection) => collection.name);
  }

  public async isCollectionExist(collectionName: string): Promise<boolean> {
    return (await this.listCollections({ name: collectionName })).some(
      (collection) => collection === collectionName
    );
  }

  public async createCollection(
    collectionName: string,
    session?: ClientSession
  ): Promise<boolean> {
    const isExist = await this.isCollectionExist(collectionName);
    if (!isExist) {
      const result = await this.db.createCollection(collectionName, {
        session,
      });
      return typeof result === 'object' && result !== null;
    }
    return false;
  }

  private async dropCollection(
    collectionName: string,
    session?: ClientSession
  ): Promise<boolean> {
    const isExist = await this.isCollectionExist(collectionName);
    if (isExist) {
      const dropResult = await this.db
        .collection(collectionName)
        .drop({ session });
      return dropResult;
    }
    return false;
  }

  private async drop(options?: DropDatabaseOptions): Promise<boolean> {
    return this.db.dropDatabase(options);
  }

  public async stats(options?: DbStatsOptions): Promise<Document> {
    return this.db.stats(options);
  }

  public async list(session?: ClientSession): Promise<ListDatabasesResult> {
    return this.dbEngine.client.db().admin().listDatabases({ session });
  }
}
