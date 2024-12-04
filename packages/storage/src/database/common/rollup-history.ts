import { TRollUpHistory, TRollUpHistoryRecord } from '@zkdb/common';
import { ReplaceOptions, UpdateResult } from 'mongodb';
import { zkDatabaseConstants } from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelBasic from '../base/basic.js';

export class ModelRollup extends ModelBasic<TRollUpHistoryRecord> {
  private static instance: ModelRollup;
  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      zkDatabaseConstants.globalCollections.rollup
    );
  }

  public static getInstance() {
    if (!ModelRollup.instance) {
      this.instance = new ModelRollup();
    }
    return this.instance;
  }

  public async create(
    args: TRollUpHistoryRecord,
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
}
