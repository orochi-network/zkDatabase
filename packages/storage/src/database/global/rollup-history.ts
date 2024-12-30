import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import {
  TRollUpHistoryRecord,
  TRollUpHistoryRecordNullable,
} from '@zkdb/common';
import { ClientSession, OptionalId, WithoutId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupHistory extends ModelGeneral<
  OptionalId<TRollUpHistoryRecordNullable>
> {
  private static instance: ModelRollupHistory;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.rollupHistory
    );
  }

  public static getInstance() {
    if (!ModelRollupHistory.instance) {
      this.instance = new ModelRollupHistory();
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      WithoutId<TRollUpHistoryRecord>
    >(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.rollupHistory
    );
    /*
      databaseName: string;
      merkletreeRoot: string;
      merkletreeRootPrevious: string;
      transactionObjectId: ObjectId;
      proofObjectId: ObjectId;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex({ databaseName: 1 }, { session });
      await collection.createSystemIndex({ merkletreeRoot: 1 }, { session });
      await collection.createSystemIndex(
        { merkletreeRootPrevious: 1 },
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
