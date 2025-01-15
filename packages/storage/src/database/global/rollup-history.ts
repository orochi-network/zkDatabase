import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import {
  TRollupHistoryRecord,
  TRollupHistoryRecordNullable,
} from '@zkdb/common';
import { ClientSession, OptionalId, WithoutId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupOnChainHistory extends ModelGeneral<
  OptionalId<TRollupHistoryRecordNullable>
> {
  private static instance: ModelRollupOnChainHistory;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.rollupHistory
    );
  }

  public static getInstance() {
    if (!ModelRollupOnChainHistory.instance) {
      this.instance = new ModelRollupOnChainHistory();
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      WithoutId<TRollupHistoryRecord>
    >(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.rollupHistory
    );
    /*
      databaseName: string;
      merkleTreeRoot: string;
      merkleTreeRootPrevious: string;
      transactionObjectId: ObjectId;
      proofObjectId: ObjectId;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex({ databaseName: 1 }, { session });
      await collection.createSystemIndex({ merkleTreeRoot: 1 }, { session });
      await collection.createSystemIndex(
        { merkleTreeRootPrevious: 1 },
        { session }
      );
      await collection.createSystemIndex({ proofObjectId: 1 }, { session });
      await collection.createSystemIndex(
        { transactionObjectId: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}
