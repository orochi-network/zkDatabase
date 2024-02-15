/* eslint-disable max-classes-per-file */
/* eslint-disable no-await-in-loop */
import { Provable } from 'o1js';
import {
  ClientSession,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
  UpdateFilter,
} from 'mongodb';
import ModelBasic from './abstract/basic';
import {
  ZKDATABASE_INDEX_COLLECTION,
  ZKDATABASE_INDEX_RECORD
} from './abstract/database-engine';
import logger from '../helper/logger';
import ModelMerkleTreePool from './merkle-tree-pool';
import { Schema } from '../core/schema';

export class ModelDocument extends ModelBasic {
  private merkleTreePool: ModelMerkleTreePool;

  private constructor(
    databaseName: string,
    collectionName: string,
    merkleTreePool: ModelMerkleTreePool
  ) {
    super(databaseName, collectionName);
    this.merkleTreePool = merkleTreePool;
  }

  public static async getInstance(
    databaseName: string,
    collectionName: string
  ) {
    const merkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
    return new ModelDocument(databaseName, collectionName, merkleTreePool);
  }

  private async getMaxIndex(session?: ClientSession): Promise<number> {
    const options = session ? { session } : {};
    const maxIndexedCursor = await this.db
      .collection(ZKDATABASE_INDEX_COLLECTION)
      .find({}, options)
      .sort({ [ZKDATABASE_INDEX_RECORD]: -1 })
      .limit(1)
      .toArray();

    return maxIndexedCursor.length === 0
      ? -1
      : maxIndexedCursor[0][ZKDATABASE_INDEX_RECORD];
  }

  public async updateOne<T>(
    filter: Filter<T>,
    update: UpdateFilter<T> & { [ZKDATABASE_INDEX_RECORD]?: never },
    session?: ClientSession
  ): Promise<boolean> {
    if (update.$set && ZKDATABASE_INDEX_RECORD in update.$set) {
      throw new Error(`Modifying ${ZKDATABASE_INDEX_RECORD} is not allowed`);
    }

    // TODO: Calculate hash of the object
  
    try {
      const result = await this.collection.updateOne(filter as Filter<any>, update, { session });
      return result.modifiedCount === 1;
    } catch (error) {
      logger.error('Error updating document', error);
      throw error;
    }
  }

  public async insertOneWithTransaction<
    T extends OptionalUnlessRequiredId<{ [key: string]: any }>,
  >(data: T): Promise<number> {
    let index = -1;

    try {
      await this.withTransaction(async (session) => {
        const result = await this.insertOne(data, session);

        if (!result) {
          throw new Error('Insertion failed');
        }

        index = result[ZKDATABASE_INDEX_RECORD];
      });
    } catch (error) {
      logger.error('Transaction failed:', error);
    }

    return index;
  }

  public async insertOne<
    T extends OptionalUnlessRequiredId<{ [key: string]: any }>,
  >(
    data: T,
    session: ClientSession
  ): Promise<T & { [ZKDATABASE_INDEX_RECORD]: number }> {
    try {
      const index = (await this.getMaxIndex(session)) + 1;
      const result: InsertOneResult<T> = await this.collection.insertOne(
        {
          [ZKDATABASE_INDEX_RECORD]: index,
          ...data,
        } as any,
        { session }
      );

      class Document extends Schema.fromRecord(data as any) {};

      const document = Document.deserialize(data as any);

      await this.merkleTreePool.saveLeaf(BigInt(index), document.hash())

      await this.db.collection(ZKDATABASE_INDEX_COLLECTION).insertOne(
        {
          [ZKDATABASE_INDEX_RECORD]: index,
          collection: this.collectionName,
          link: result.insertedId,
        },
        { session }
      );

      logger.debug(`ModelDocument::insertOne()`, { index, data });
      return { ...data, [ZKDATABASE_INDEX_RECORD]: index };
    } catch (error) {
      logger.error('Error inserting document', error);
      throw error;
    }
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
