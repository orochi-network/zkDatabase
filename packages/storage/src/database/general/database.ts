import {
  ObjectId,
  Document,
  ListDatabasesResult,
  ClientSession,
} from 'mongodb';
import ModelBasic from '../base/basic.js';
import {
  zkDatabaseConstants,
  zkDatabaseMetadataCollections,
} from '../../common/index.js';

export type DocumentMetaIndex = {
  collection: string;
  docId: ObjectId;
  index: number;
};

/**
 * Handles database operations. Extends ModelBasic.
 * This class should not be used directly.
 */
export class ModelDatabase<T extends Document> extends ModelBasic<T> {
  private static instances: Map<string, ModelDatabase<any>> = new Map();

  constructor(databaseName?: string) {
    super(databaseName || zkDatabaseConstants.globalDatabase);
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
    console.log(
      `(await this.listCollections()) `,
      await this.listCollections()
    );
    return (await this.listCollections()).some(
      (collection) => collection === collectionName
    );
  }

  public async createCollection(
    collectionName: string,
    session?: ClientSession
  ): Promise<void> {
    const isExist = await this.isCollectionExist(collectionName);
    if (!isExist) {
      await this.db.createCollection(collectionName, { session });
    }
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

export default ModelDatabase;
