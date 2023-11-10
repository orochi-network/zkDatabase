import { CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { isOk } from '../helper/common'
import { ModelBasic } from './abstract/basic';
import { ModelDocument } from './document';

export class ModelCollection extends ModelBasic {
  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, collectionName);
  }

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
    return this.collection.createIndex(indexSpecs, indexOptions);
  }

  public async drop() {
    return this.db.dropCollection(this.collectionName!);
  }

  public async index(
    indexSpec: IndexSpecification,
    indexOptions?: CreateIndexesOptions
  ) {
    return isOk(async () => this.collection.createIndex(indexSpec, indexOptions));
  }

  public async isIndexed(indexName: string): Promise<boolean> {
    for await (const index of this.collection.listIndexes()) {
      if (index.name === indexName) {
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
