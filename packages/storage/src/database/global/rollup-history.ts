import { TRollUpHistory, TRollUpHistoryRecord } from '@zkdb/common';
import {
  ClientSession,
  ReplaceOptions,
  UpdateResult,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelBasic from '../base/basic.js';
import ModelCollection from '../general/collection.js';

export class ModelRollup extends ModelBasic<WithoutId<TRollUpHistoryRecord>> {
  private static instance: ModelRollup;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DB.service,
      zkDatabaseConstant.globalCollection.rollup
    );
  }

  public static getInstance() {
    if (!ModelRollup.instance) {
      this.instance = new ModelRollup();
    }
    return this.instance;
  }

  public async create(
    args: WithoutId<TRollUpHistoryRecord>,
    options?: ReplaceOptions
  ): Promise<boolean> {
    try {
      await this.collection.insertOne(
        {
          ...args,
          databaseName: args.databaseName,
        },
        options
      );

      return true;
    } catch (error) {
      logger.error('Error saving rollup:', error);
      return false;
    }
  }

  public async update(
    databaseName: string,
    updateRollup: Partial<TRollUpHistory>
  ): Promise<UpdateResult<TRollUpHistoryRecord>> {
    return this.collection.updateOne(
      { databaseName },
      { $set: updateRollup },
      {
        upsert: true,
      }
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      WithoutId<TRollUpHistoryRecord>
    >(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.proof
    );
    if (!(await collection.isExist())) {
      collection.index({ databaseName: 1 }, { unique: true, session });
      collection.index({ merkletreeRootCurrent: 1 }, { unique: true, session });
      collection.index({ merkletreeRootCurrent: 1 }, { unique: true, session });
      collection.index({ proofObjectId: 1 }, { unique: true, session });
      collection.index({ transactionObjectId: 1 }, { unique: true, session });
    }
  }
}
