import { ObjectId, ReplaceOptions, UpdateResult } from 'mongodb';
import { zkDatabaseConstants } from '../../common/index.js';
import logger from '../../helper/logger.js';
import ModelBasic from '../base/basic.js';
import { DatabaseEngine } from '../database-engine.js';

export type RollupHistory = {
  merkleRoot: string;
  newMerkleRoot: string;
  databaseName: string;
  txId: ObjectId;
};

export class ModelRollup extends ModelBasic<RollupHistory> {
  private static instance: ModelRollup;
  private static dbEngine: DatabaseEngine;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      ModelRollup.dbEngine,
      zkDatabaseConstants.globalCollections.rollup
    );
  }

  public static createModel(dbEngine: DatabaseEngine) {
    ModelRollup.dbEngine = dbEngine;
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
    return this.collection.updateOne(
      { databaseName },
      { $set: updateRollup },
      {
        upsert: true,
      }
    );
  }
}
