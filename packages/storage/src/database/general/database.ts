import { ObjectId, Document } from 'mongodb';
import ModelBasic from '../base/basic';
import { ZKDATABASE_METADATA } from '../../common/const';

export type DocumentMetaIndex = {
  collection: string;
  docId: ObjectId;
  index: number;
};

/**
 * Build on top of ModelBasic, it handle everything about database in general
 * Don't use this directly
 */
export class ModelDatabase<T extends Document> extends ModelBasic<T> {
  public static instances = new Map<string, ModelDatabase<any>>();

  public static getInstance(databaseName: string) {
    if (!ModelDatabase.instances.has(databaseName)) {
      ModelDatabase.instances.set(
        databaseName,
        new ModelDatabase(databaseName)
      );
    }
    return ModelDatabase.instances.get(databaseName)!;
  }

  public async listCollections() {
    const collections = await this.db.listCollections();
    return (await collections.toArray()).filter(
      (e) => !ZKDATABASE_METADATA.includes(e.name)
    );
  }

  public async drop() {
    return this.db.dropDatabase();
  }

  public async stats() {
    return this.db.stats();
  }

  public async list() {
    return this.dbEngine.client.db().admin().listDatabases();
  }
}

export default ModelDatabase;
