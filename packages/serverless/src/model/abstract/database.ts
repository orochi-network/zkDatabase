import { ObjectId } from 'mongodb';
import ModelBasic from './basic';
import { ZKDATABASE_METADATA } from '../../common/const';
import ModelDocumentMetadata from '../database/document-metadata';
import { ModelSchema } from '../database/schema';
import ModelGroup from '../database/group';
import ModelUserGroup from '../database/user-group';

export type DocumentMetaIndex = {
  collection: string;
  docId: ObjectId;
  index: number;
};

/**
 * Build on top of ModelBasic, it handle everything about database in general
 * Don't use this directly
 */
export class ModelDatabase extends ModelBasic {
  public static instances = new Map<string, ModelDatabase>();

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

  public async create(databaseName: string) {
    if (await this.dbEngine.isDatabase(databaseName)) {
      throw new Error('Database already exist');
    }
    await ModelDocumentMetadata.init(databaseName);
    await ModelSchema.init(databaseName);
    await ModelGroup.init(databaseName);
    await ModelUserGroup.init(databaseName);
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
