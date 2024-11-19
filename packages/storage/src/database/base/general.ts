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
  CountDocumentsOptions,
  WithoutId,
  ReplaceOptions,
} from 'mongodb';
import { ModelBasic } from './basic';
import { logger } from '@helper';

/**
 * ModelGeneral was build to handle global metadata, this is mongodb general model and it have nothing
 * to do with zkDatabase or record of zkDatabase
 */
export class ModelGeneral<T extends Document> extends ModelBasic<T> {
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
  ): Promise<UpdateResult<T>> {
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

  public async replaceOne(
    filter: Filter<T>,
    replacement: WithoutId<T>,
    options?: ReplaceOptions
  ): Promise<UpdateResult<T> | Document> {
    logger.debug(`ModelGeneral::replaceOne()`, filter, replacement);
    return this.collection.replaceOne(filter, replacement, options);
  }

  public async insertMany(
    docs: OptionalUnlessRequiredId<T>[],
    options?: BulkWriteOptions
  ): Promise<InsertManyResult<T>> {
    logger.debug(`ModelGeneral::insertMany()`, docs);
    return this.collection.insertMany(docs, options);
  }

  public async findOne(
    filter?: Filter<T>,
    options?: FindOptions
  ): Promise<WithId<T> | null> {
    logger.debug(`ModelGeneral::findOne()`, filter);
    return this.collection.findOne(filter || {}, options);
  }

  public async find(filter?: Filter<T>, options?: FindOptions) {
    logger.debug(`ModelGeneral::find()`, filter);
    return this.collection.find(filter || {}, options);
  }

  public async count(
    filter?: Filter<T>,
    options?: CountDocumentsOptions
  ): Promise<number> {
    logger.debug(`ModelGeneral::count()`, filter);
    return this.collection.countDocuments(filter || {}, options);
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
