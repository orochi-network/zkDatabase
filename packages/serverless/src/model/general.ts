/* eslint-disable no-await-in-loop */
import {
  ClientSession,
  Filter,
  OptionalUnlessRequiredId,
  InsertOneResult,
  OptionalId,
  InsertManyResult,
} from 'mongodb';
import ModelBasic from './abstract/basic';
import { IndexedDocument } from './abstract/database-engine';
import logger from '../helper/logger';

export type SessionSchema = {
  username: string;
  sessionId: string;
  sessionKey: string;
  createdAt: Date;
};

export class ModelGeneral extends ModelBasic {
  public async updateOne(filter: Filter<any>, update: any): Promise<boolean> {
    let updated = false;
    await this.withTransaction(async (session: ClientSession) => {
      const result = await this.collection.updateMany(
        filter,
        {
          $set: {
            ...update,
          },
        },
        {
          session,
        }
      );
      if (result.modifiedCount === 1) {
        updated = true;
        logger.debug(`ModelGeneral::updateOne()`, result);
      } else {
        await session.abortTransaction();
      }
    });
    return updated;
  }

  public async insertOne<T extends any>(
    data: OptionalUnlessRequiredId<T>
  ): Promise<InsertOneResult<IndexedDocument>> {
    let insertResult;
    await this.withTransaction(async (session: ClientSession) => {
      const result: InsertOneResult<IndexedDocument> =
        await this.collection.insertOne(data as any, { session });
      insertResult = result;
      logger.debug(`ModelGeneral::insertOne()`, result);
    });
    return insertResult as any;
  }

  public async insertMany<T extends any>(data: OptionalId<T>[]) {
    let insertResult;
    await this.withTransaction(async (session: ClientSession) => {
      const result: InsertManyResult<IndexedDocument> =
        await this.collection.insertMany(data as any[], { session });
      insertResult = result;
      logger.debug(`ModelGeneral::insertMany()`, result);
    });
    return insertResult;
  }

  public async findOne(filter: Filter<any>) {
    logger.debug(`ModelGeneral::findOne()`, filter);
    return this.collection.findOne(filter);
  }

  public async find(filter?: Filter<any>) {
    logger.debug(`ModelGeneral::find()`, filter);
    return this.collection.find(filter || {}).toArray();
  }

  public async drop(filter: Filter<any>) {
    let deletedResult;
    await this.withTransaction(async (session: ClientSession) => {
      deletedResult = await this.collection.deleteMany(filter, { session });
    });
    logger.debug(`ModelGeneral::drop()`, deletedResult);
    return deletedResult;
  }
}

export default ModelGeneral;
