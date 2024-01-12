import { Document, ObjectId } from 'mongodb';
import ModelBasic from './basic';
import {
  ZKDATABASE_INDEX_COLLECTION,
  ZKDATABASE_INDEX_RECORD,
} from '../../common/const';
import { ModelCollection } from './collection';
import logger from '../../helper/logger';

/**
 * Build on top of ModelBasic, it handle everything about database in general
 * Don't use this directly
 */
export class ModelDatabase extends ModelBasic {
  public static getInstance(databaseName: string) {
    return new ModelDatabase(databaseName);
  }

  public getCollection(name: string): ModelCollection {
    return ModelCollection.getInstance(this.databaseName!, name);
  }

  public async listCollections() {
    const collections = await this.db.listCollections();
    return (await collections.toArray()).filter(
      (e) => e.name !== ZKDATABASE_INDEX_COLLECTION
    );
  }

  public async findIndex<T extends Document>(index: number): Promise<T | null> {
    const indexRecord = await this.db
      .collection(ZKDATABASE_INDEX_COLLECTION)
      .findOne({
        [ZKDATABASE_INDEX_RECORD]: index,
      });
    if (indexRecord) {
      return this.db.collection(indexRecord.collection).findOne<T>({
        _id: indexRecord.link as unknown as ObjectId,
      });
    }
    logger.debug('ModelDatabase::findIndex()', { index, indexRecord });
    return null;
  }

  public async create() {
    return this.dbEngine.sync(this.databaseName!);
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
