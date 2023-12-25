import { CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { isOk } from '../helper/common';
import ModelBasic from './abstract/basic';
import { ModelDocument } from './document';

export class ModelCollection extends ModelBasic {
  public static getInstance(databaseName: string, collectionName: string) {
    return new ModelCollection(databaseName, collectionName);
  }

  public getDocument() {
    return ModelDocument.getInstance(this.databaseName!, this.collectionName!);
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
