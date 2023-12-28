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
} from 'mongodb';
import ModelBasic from './abstract/basic';
import logger from '../helper/logger';

export class ModelGeneral extends ModelBasic {
  public async updateOne(
    filter: Filter<Document>,
    update: UpdateFilter<Document> | Partial<Document>,
    options?: UpdateOptions
  ): Promise<UpdateResult<Document>> {
    logger.debug(`ModelGeneral::updateOne()`, filter, update);
    return this.collection.updateOne(filter, { $set: update }, options);
  }

  public async insertOne(
    doc: OptionalUnlessRequiredId<Document>,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<Document>> {
    logger.debug(`ModelGeneral::insertOne()`, doc);
    return this.collection.insertOne(doc, options);
  }

  public async insertMany(
    docs: OptionalUnlessRequiredId<Document>[],
    options?: BulkWriteOptions
  ): Promise<InsertManyResult<Document>> {
    logger.debug(`ModelGeneral::insertMany()`, docs);
    return this.collection.insertMany(docs, options);
  }

  public async findOne(
    filter: Filter<Document>
  ): Promise<WithId<Document> | null> {
    logger.debug(`ModelGeneral::findOne()`, filter);
    return this.collection.findOne(filter);
  }

  public async find(filter?: Filter<Document>): Promise<Document[]> {
    logger.debug(`ModelGeneral::find()`, filter);
    return this.collection.find(filter || {}).toArray();
  }

  public async deleteOne(
    filter?: Filter<Document>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    logger.debug(`ModelGeneral::deleteOne()`, filter);
    return this.collection.deleteOne(filter, options);
  }

  public async deleteMany(
    filter?: Filter<Document>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    logger.debug(`ModelGeneral::deleteMany()`, filter);
    return this.collection.deleteMany(filter, options);
  }
}

export default ModelGeneral;
