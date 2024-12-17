import { TRollUpHistory, TRollUpHistoryRecord } from '@zkdb/common';
import {
  ClientSession,
  OptionalId,
  ReplaceOptions,
  UpdateResult,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/index.js';
import { addTimestampMongoDB } from '../../helper/common.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelBasic from '../base/basic.js';
import ModelCollection from '../general/collection.js';
import ModelGeneral from '../base/general.js';

export class ModelRollup extends ModelGeneral<
  OptionalId<TRollUpHistoryRecord>
> {
  private static instance: ModelRollup;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.rollup
    );
  }

  public static getInstance() {
    if (!ModelRollup.instance) {
      this.instance = new ModelRollup();
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      WithoutId<TRollUpHistoryRecord>
    >(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.proof
    );
    /*
      databaseName: string;
      merkletreeRootCurrent: string;
      merkletreeRootPrevious: string;
      transactionObjectId: ObjectId;
      proofObjectId: ObjectId;
    */
    if (!(await collection.isExist())) {
      await collection.index({ databaseName: 1 }, { unique: true, session });
      await collection.index(
        { merkletreeRootCurrent: 1 },
        { unique: true, session }
      );
      await collection.index(
        { merkletreeRootPrevious: 1 },
        { unique: true, session }
      );
      await collection.index({ proofObjectId: 1 }, { unique: true, session });
      await collection.index(
        { transactionObjectId: 1 },
        { unique: true, session }
      );

      await addTimestampMongoDB(collection, session);
    }
  }
}
