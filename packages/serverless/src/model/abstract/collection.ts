import { CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { isOk } from '../../helper/common';
import ModelBasic from './basic';
import ModelDatabase from './database';

/**
 * Build on top of ModelBasic, it handle everything about collection in general
 * Don't use this directly
 */
export class ModelCollection extends ModelBasic {
  public static instances = new Map<string, ModelCollection>();

  get modelDatabase() {
    return ModelDatabase.getInstance(this.databaseName!);
  }

  public static getInstance(databaseName: string, collectionName: string) {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelCollection.instances.has(key)) {
      ModelCollection.instances.set(key, new ModelCollection(key));
    }
    return ModelCollection.instances.get(key)!;
  }

  public async create(
    indexSpecs: IndexSpecification,
    indexOptions?: CreateIndexesOptions
  ) {
    if (
      this.databaseName &&
      this.collectionName &&
      (await this.dbEngine.isCollection(this.databaseName, this.collectionName))
    ) {
      return new ModelCollection(
        this.databaseName,
        this.collectionName
      ).collection.createIndex(indexSpecs, indexOptions);
    }
    throw new Error('Database and collection was not set');
  }

  public async drop() {
    return this.db.dropCollection(this.collectionName!);
  }

  public async index(
    indexSpec: IndexSpecification,
    indexOptions?: CreateIndexesOptions
  ) {
    return isOk(async () =>
      this.collection.createIndex(indexSpec, indexOptions)
    );
  }

  public async isIndexed(indexName: string): Promise<boolean> {
    const indexArray = await this.collection.listIndexes().toArray();
    for (let i = 0; i < indexArray.length; i += 1) {
      if (indexArray[i].name === indexName) {
        return true;
      }
    }
    return false;
  }

  public async dropIndex(indexName: string) {
    return isOk(async () => this.collection.dropIndex(indexName));
  }

  public async listIndexes() {
    return this.collection.listIndexes().toArray();
  }
}

export default ModelCollection;
