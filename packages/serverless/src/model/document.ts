/* eslint-disable no-await-in-loop */
import {
  ClientSession,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
} from 'mongodb';
import ModelBasic from './abstract/basic';
import { IndexedDocument } from './abstract/database-engine';
import logger from '../helper/logger';
import {
  ZKDATABASE_INDEX_COLLECTION,
  ZKDATABASE_INDEX_RECORD,
} from '../common/const';

/**
 * ModelDocument is a class that extends ModelBasic.
 * Model document handle document of zkDatabase with index hook
 */
export class ModelDocument extends ModelBasic {
  public static getInstance(databaseName: string, collectionName: string) {
    return new ModelDocument(databaseName, collectionName);
  }

  private async getMaxIndex(): Promise<number> {
    const maxIndexedCursor = await this.db
      .collection(ZKDATABASE_INDEX_COLLECTION)
      .find()
      .sort({ [ZKDATABASE_INDEX_RECORD]: -1 })
      .limit(1);
    const maxIndexedRecord: any = (await maxIndexedCursor.hasNext())
      ? await maxIndexedCursor.next()
      : { [ZKDATABASE_INDEX_RECORD]: -1 };

    return maxIndexedRecord !== null &&
      typeof maxIndexedRecord[ZKDATABASE_INDEX_RECORD] === 'number'
      ? maxIndexedRecord[ZKDATABASE_INDEX_RECORD]
      : -1;
  }

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
      } else {
        await session.abortTransaction();
      }
    });
    return updated;
  }

  public async insertOne<T extends any>(data: OptionalUnlessRequiredId<T>) {
    let insertResult;
    await this.withTransaction(async (session: ClientSession) => {
      const index = (await this.getMaxIndex()) + 1;
      const result: InsertOneResult<IndexedDocument> =
        await this.collection.insertOne(
          {
            [ZKDATABASE_INDEX_RECORD]: index,
            ...data,
          } as any,
          { session }
        );
      await this.db.collection(ZKDATABASE_INDEX_COLLECTION).insertOne(
        {
          [ZKDATABASE_INDEX_RECORD]: index,
          collection: this.collectionName,
          link: result.insertedId,
        },
        { session }
      );
      insertResult = {
        [ZKDATABASE_INDEX_RECORD]: index,
        ...data,
      };
      logger.debug(`ModelDocument::insertOne()`, { result, insertResult });
    });
    return insertResult;
  }

  public async findOne(filter: Filter<any>) {
    logger.debug(`ModelDocument::findOne()`, { filter });
    return this.collection.findOne(filter);
  }

  public async find(filter?: Filter<any>) {
    logger.debug(`ModelDocument::find()`, { filter });
    return this.collection.find(filter || {}).toArray();
  }

  public async drop(filter: Filter<any>) {
    let deletedCount = 0;
    const acknowledged = await this.withTransaction(
      async (session: ClientSession) => {
        const filteredRecords = await this.collection.find(filter);
        while (await filteredRecords.hasNext()) {
          const record = await filteredRecords.next();
          if (record) {
            await this.db
              .collection(ZKDATABASE_INDEX_COLLECTION)
              .deleteOne(
                { [ZKDATABASE_INDEX_RECORD]: record[ZKDATABASE_INDEX_RECORD] },
                { session }
              );
            await this.collection.deleteOne({ _id: record._id }, { session });
            deletedCount += 1;
          }
        }
      }
    );
    logger.debug(`ModelDocument::drop()`, {
      filter,
      acknowledged,
      deletedCount,
    });
    return { acknowledged, deletedCount };
  }
}

export default ModelDocument;
