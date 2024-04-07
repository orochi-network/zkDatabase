import { CreateIndexesOptions, IndexSpecification, Document } from 'mongodb';
import { isOk } from '../../helper/common';
import ModelBasic from '../base/basic';
import ModelDatabase from './database';
import logger from '../../helper/logger';

/**
 * Handles collection operations. Extends ModelBasic.
 * This class should not be used directly.
 */
export class ModelCollection<T extends Document> extends ModelBasic<T> {
  private static instances: Map<string, ModelCollection<any>> = new Map();

  public get modelDatabase() {
    return ModelDatabase.getInstance(this.databaseName);
  }

  public static getInstance<T extends Document>(databaseName: string, collectionName: string): ModelCollection<T> {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelCollection.instances.has(key)) {
      ModelCollection.instances.set(key, new ModelCollection<T>(databaseName, collectionName));
    }
    return ModelCollection.instances.get(key) as ModelCollection<T>;
  }

  public async isExist(): Promise<boolean> {
    if (!this.collectionName) {
      return false;
    }
    return this.dbEngine.isCollection(this.databaseName, this.collectionName);
  }

  public async create(indexSpecs: IndexSpecification, indexOptions?: CreateIndexesOptions): Promise<string> {
    if (!this.databaseName || !this.collectionName) {
      throw new Error('Database and collection were not set');
    }
    return this.collection.createIndex(indexSpecs, indexOptions);
  }

  public async drop(): Promise<boolean> {
    if (!this.collectionName) {
      logger.debug('collectionName is null')
      return false;
    }
    await this.db.dropCollection(this.collectionName);
    return true;
  }

  public async index(indexSpec: IndexSpecification, indexOptions?: CreateIndexesOptions): Promise<boolean> {
    return isOk(async () => this.collection.createIndex(indexSpec, indexOptions));
  }

  public async isIndexed(indexName: string): Promise<boolean> {
    const indexArray = await this.collection.listIndexes().toArray();
    return indexArray.some((index) => index.name === indexName);
  }

  public async dropIndex(indexName: string): Promise<boolean> {
    return isOk(async () => this.collection.dropIndex(indexName));
  }

  public async listIndexes(): Promise<any[]> {
    return this.collection.listIndexes().toArray();
  }
}

export default ModelCollection;
