import { FindOptions, ObjectId } from 'mongodb';
import ModelBasic from './basic';
import {
  ZKDATABASE_MERKLE_INDEX_COLLECTION,
  ZKDATABASE_METADATA_COLLECTION,
} from '../../common/const';

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

  public async getMaxIndex(findOpt?: FindOptions): Promise<number> {
    const maxIndexedCursor = await this.db
      .collection(ZKDATABASE_MERKLE_INDEX_COLLECTION)
      .find({}, findOpt)
      .sort({ index: -1 })
      .limit(1);
    const maxIndexedRecord: any = (await maxIndexedCursor.hasNext())
      ? await maxIndexedCursor.next()
      : { index: -1 };

    return maxIndexedRecord !== null &&
      typeof maxIndexedRecord.index === 'number'
      ? maxIndexedRecord.index
      : -1;
  }

  public async listCollections() {
    const collections = await this.db.listCollections();
    return (await collections.toArray()).filter(
      (e) => !ZKDATABASE_METADATA_COLLECTION.includes(e.name)
    );
  }

  public async create(databaseName: string) {
    if (await this.dbEngine.isDatabase(databaseName)) {
      throw new Error('Database already exist');
    }
    // Create metdata index collection
    if (
      !(await this.dbEngine.isCollection(
        databaseName,
        ZKDATABASE_MERKLE_INDEX_COLLECTION
      ))
    ) {
      await this.dbEngine
        .db(databaseName)
        .createCollection(ZKDATABASE_MERKLE_INDEX_COLLECTION);

      // Collection name and document ID must be unique
      await this.dbEngine
        .db(databaseName)
        .collection(ZKDATABASE_MERKLE_INDEX_COLLECTION)
        .createIndex({ collection: 1, docId: 1 }, { unique: true });

      // Never have two document with same index
      await this.dbEngine
        .db(databaseName)
        .collection(ZKDATABASE_MERKLE_INDEX_COLLECTION)
        .createIndex({ index: 1 }, { unique: true });
    }
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
