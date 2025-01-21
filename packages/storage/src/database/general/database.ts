import { zkDatabaseConstant, zkDatabaseMetadataCollections } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { ClientSession, Document, ListDatabasesResult } from 'mongodb';
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

  public async listCollections(): Promise<string[]> {
    const collections = await this.db.listCollections().toArray();
    return collections
      .filter(
        (collection) => !zkDatabaseMetadataCollections.includes(collection.name)
      )
      .map((collection) => collection.name);
  }

  public async isCollectionExist(collectionName: string): Promise<boolean> {
    return (await this.listCollections()).some(
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

  public async dropCollection(collectionName: string): Promise<boolean> {
    const isExist = await this.isCollectionExist(collectionName);
    if (isExist) {
      await this.db.collection(collectionName).drop();
      return true;
    }
    return false;
  }

  public async drop(): Promise<boolean> {
    await this.db.dropDatabase();
    return true;
  }

  public async stats(): Promise<Document> {
    return this.db.stats();
  }

  public async list(): Promise<ListDatabasesResult> {
    return this.dbEngine.client.db().admin().listDatabases();
  }
}
