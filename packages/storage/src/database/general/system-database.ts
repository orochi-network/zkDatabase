import {
  ClientSession,
  Document,
  ListDatabasesResult,
  ObjectId,
} from 'mongodb';
import {
  zkDatabaseConstants,
  zkDatabaseMetadataCollections,
} from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';

export type DocumentMetaIndex = {
  collection: string;
  docId: ObjectId;
  index: number;
};

/**
 * Handles database operations. Extends ModelBasic.
 * This class should not be used directly.
 */
export class ModelSystemDatabase<T extends Document> extends ModelBasic<T> {
  private static instances: Map<string, ModelSystemDatabase<any>> = new Map();

  constructor(databaseName?: string) {
    super(databaseName || zkDatabaseConstants.globalDatabase, DB.service);
  }

  public static getInstance<T extends Document>(
    databaseName: string
  ): ModelSystemDatabase<T> {
    if (!ModelSystemDatabase.instances.has(databaseName)) {
      ModelSystemDatabase.instances.set(
        databaseName,
        new ModelSystemDatabase<T>(databaseName)
      );
    }
    return ModelSystemDatabase.instances.get(
      databaseName
    ) as ModelSystemDatabase<T>;
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
  ): Promise<void> {
    // const isExist = await this.isCollectionExist(collectionName);
    // if (!isExist) {
    await this.db.createCollection(collectionName, { session });
    // }
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

export default ModelSystemDatabase;
