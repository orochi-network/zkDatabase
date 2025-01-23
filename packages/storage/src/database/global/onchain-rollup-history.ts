import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import {
  TRollupOnChainHistoryRecord,
  TRollupOnChainHistoryTransactionAggregate,
} from '@zkdb/common';
import {
  AggregationCursor,
  ClientSession,
  OptionalId,
  WithoutId,
} from 'mongodb';
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

  public rollupOnChainHistoryAndTransaction(
    filter: Partial<TRollupOnChainHistoryRecord>,
    session?: ClientSession
  ): AggregationCursor<TRollupOnChainHistoryTransactionAggregate> {
    return this.collection.aggregate<TRollupOnChainHistoryTransactionAggregate>(
      [
        {
          $match: filter,
        },
        {
          $sort: { updatedAt: -1, createdAt: -1 },
        },
        {
          $lookup: {
            from: zkDatabaseConstant.globalCollection.transaction,
            localField: 'transactionObjectId',
            foreignField: '_id',
            as: 'transaction',
          },
        },
        {
          $addFields: {
            // It's 1-1 relation so the array must have 1 element
            transaction: { $arrayElemAt: ['$transaction', 0] },
          },
        },
      ],
      {
        session,
      }
    );
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
