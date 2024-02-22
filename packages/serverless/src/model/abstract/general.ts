import {
  Filter,
  OptionalUnlessRequiredId,
  InsertOneResult,
  BulkWriteOptions,
  InsertManyResult,
  InsertOneOptions,
  Document,
  UpdateFilter,
  UpdateOptions,
  WithId,
  UpdateResult,
  DeleteOptions,
  DeleteResult,
  FindOptions,
} from 'mongodb';
import ModelBasic from './basic';
import logger from '../../helper/logger';

/**
 * ModelGeneral was build to handle global metadata, this is mongodb general model and it have nothing
 * to do with zkDatabase or record of zkDatabase
 */
export class ModelGeneral<T extends Document> extends ModelBasic<T> {
  public static getInstance<P>(databaseName: string, collectionName: string) {
    return new Proxy(new ModelGeneral(databaseName, collectionName), {
      get(target: any, prop: string) {
        if (typeof target.collection[prop] === 'function') {
          // eslint-disable-next-line prefer-rest-params
          target.collection[prop].apply(target, arguments);
        }
        return target.collection[prop];
      },
    });
  }

  public async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<UpdateResult<T>> {
    logger.debug(`ModelGeneral::updateOne()`, filter, update);
    return this.collection.updateOne(filter, update, options);
  }

  public async updateMany(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<UpdateResult<Document>> {
    logger.debug(`ModelGeneral::updateOne()`, filter, update);
    return this.collection.updateMany(filter, update, options);
  }

  public async insertOne(
    doc: OptionalUnlessRequiredId<T>,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<T>> {
    logger.debug(`ModelGeneral::insertOne()`, doc);
    return this.collection.insertOne(doc, options);
  }

  public async insertMany(
    docs: OptionalUnlessRequiredId<T>[],
    options?: BulkWriteOptions
  ): Promise<InsertManyResult<T>> {
    logger.debug(`ModelGeneral::insertMany()`, docs);
    return this.collection.insertMany(docs, options);
  }

  public async findOne(
    filter: Filter<T>,
    options?: FindOptions
  ): Promise<WithId<T> | null> {
    logger.debug(`ModelGeneral::findOne()`, filter);
    return this.collection.findOne(filter, options);
  }

  public async find(filter?: Filter<T>): Promise<WithId<T>[]> {
    logger.debug(`ModelGeneral::find()`, filter);
    return this.collection.find(filter || {}).toArray();
  }

  public async count(filter?: Filter<T>): Promise<number> {
    logger.debug(`ModelGeneral::count()`, filter);
    return this.collection.countDocuments(filter || {});
  }

  public async deleteOne(
    filter?: Filter<T>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    logger.debug(`ModelGeneral::deleteOne()`, filter);
    return this.collection.deleteOne(filter, options);
  }

  public async deleteMany(
    filter?: Filter<T>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    logger.debug(`ModelGeneral::deleteMany()`, filter);
    return this.collection.deleteMany(filter, options);
  }
}

export default ModelGeneral;
