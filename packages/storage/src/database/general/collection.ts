import { TCollectionIndexSpecification } from '@zkdb/common';
import {
  CreateIndexesOptions,
  Document,
  DropIndexesOptions,
  IndexSpecification,
} from 'mongodb';
import { isOk } from '../../helper/common.js';
import logger from '../../helper/logger.js';
import ModelBasic from '../base/basic.js';
import { DatabaseEngine } from '../database-engine.js';
import ModelDatabaseMetadata from './database.js';

/**
 * Handles collection operations. Extends ModelBasic.
 * This class should not be used directly.
 */
export class ModelCollection<T extends Document> extends ModelBasic<T> {
  private static instances: Map<string, ModelCollection<any>> = new Map();

  public get modelDatabase() {
    return ModelDatabaseMetadata.getInstance(this.databaseName);
  }

  public static getInstance<T extends Document>(
    databaseName: string,
    databaseEngine: DatabaseEngine,
    collectionName: string
  ): ModelCollection<T> {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelCollection.instances.has(key)) {
      ModelCollection.instances.set(
        key,
        new ModelCollection<T>(databaseName, databaseEngine, collectionName)
      );
    }
    return ModelCollection.instances.get(key) as ModelCollection<T>;
  }

  public async isExist(): Promise<boolean> {
    if (!this.collectionName) {
      return false;
    }
    return this.dbEngine.isCollection(this.databaseName, this.collectionName);
  }

  public async create(
    indexSpecs: IndexSpecification,
    indexOptions?: CreateIndexesOptions
  ): Promise<string> {
    if (!this.databaseName || !this.collectionName) {
      throw new Error('Database and collection were not set');
    }
    return this.collection.createIndex(indexSpecs, indexOptions);
  }

  public async drop(): Promise<boolean> {
    if (!this.collectionName) {
      logger.debug('collectionName is null');
      return false;
    }
    await this.db.dropCollection(this.collectionName);
    return true;
  }

  public async index(
    indexSpec: TCollectionIndexSpecification<T> | IndexSpecification,
    indexOptions?: CreateIndexesOptions
  ): Promise<boolean> {
    return isOk(async () =>
      this.collection.createIndex(indexSpec as IndexSpecification, indexOptions)
    );
  }

  public async isIndexed(indexName: string): Promise<boolean> {
    const indexArray = await this.collection.listIndexes().toArray();
    return indexArray.some((index) => index.name === indexName);
  }

  public async dropIndex(
    indexName: string,
    options?: DropIndexesOptions
  ): Promise<boolean> {
    return isOk(async () => this.collection.dropIndex(indexName, options));
  }

  public async listIndexes(): Promise<string[]> {
    return (await this.collection.listIndexes().toArray()).map((i) => i.name);
  }

  public async size(): Promise<number> {
    return (await this.db.command({ collStats: this.collectionName })).size;
  }

  public async info() {
    return this.db.command({ collStats: this.collectionName });
  }
}

export default ModelCollection;
