import { ObjectId, ReplaceOptions, UpdateResult } from 'mongodb';
import { zkDatabaseConstants } from '../../common';
import { DB } from '../../helper';
import logger from '../../helper/logger';
import ModelBasic from '../base/basic.js';

export type RollupHistory = {
  merkleRoot: string;
  newMerkleRoot: string;
  databaseName: string;
  txId: ObjectId;
};

export class ModelRollup extends ModelBasic<RollupHistory> {
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
    args: RollupHistory,
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
    updateRollup: Partial<RollupHistory>
  ): Promise<UpdateResult<RollupHistory>> {
    return this.collection.updateOne({ databaseName }, updateRollup, {
      upsert: true,
    });
  }
}