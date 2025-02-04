import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import {
  TPagination,
  TRollupOnChainHistoryRecord,
  TRollupOnChainHistoryTransactionAggregate,
} from '@zkdb/common';
import {
  AggregationCursor,
  ClientSession,
  Document,
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
    pagination?: TPagination,
    session?: ClientSession
  ): AggregationCursor<TRollupOnChainHistoryTransactionAggregate> {
    const pipeline: Document[] = [
      { $match: filter },
      { $sort: { updatedAt: -1, createdAt: -1 } },
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
          // Since it's a 1-to-1 relation, we take the first element of the array.
          transaction: { $arrayElemAt: ['$transaction', 0] },
        },
      },
    ];

    // Conditionally add pagination stages
    if (pagination) {
      const { offset, limit } = pagination;

      if (typeof offset === 'number' && offset > 0) {
        pipeline.push({ $skip: offset });
      }

      if (typeof limit === 'number' && limit > 0) {
        pipeline.push({ $limit: limit });
      }
    }

    // Run the aggregate with the built pipeline
    return this.collection.aggregate<TRollupOnChainHistoryTransactionAggregate>(
      pipeline,
      { session }
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
