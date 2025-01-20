import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TRollupOnChainHistoryRecord } from '@zkdb/common';
import { ClientSession, OptionalId, WithoutId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupOnChainHistory extends ModelGeneral<
  OptionalId<TRollupOnChainHistoryRecord>
> {
  private static instance: ModelRollupOnChainHistory;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless,
      zkDatabaseConstant.globalCollection.rollupOnChainHistory
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
      WithoutId<TRollupOnChainHistoryRecord>
    >(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless,
      zkDatabaseConstant.globalCollection.rollupOnChainHistory
    );
    /*
      databaseName: string;
      merkleTreeRoot: string;
      merkleTreeRootPrevious: string;
      transactionObjectId: ObjectId;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex({ databaseName: 1 }, { session });
      await collection.createSystemIndex({ merkleRootNew: 1 }, { session });
      await collection.createSystemIndex({ merkleRootOld: 1 }, { session });
      await collection.createSystemIndex(
        { transactionObjectId: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}
