import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import {
  TRollupOffChainRecord,
  TRollupOffChainTransitionAggregate,
} from '@zkdb/common';
import { AggregationCursor, ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupOffChain extends ModelGeneral<
  OptionalId<TRollupOffChainRecord>
> {
  public static instance: ModelRollupOffChain;

  public static getInstance(): ModelRollupOffChain {
    if (!this.instance) {
      this.instance = new ModelRollupOffChain(
        zkDatabaseConstant.globalMinaDatabase,
        DATABASE_ENGINE.dbMina,
        zkDatabaseConstant.globalCollection.rollupOffChain
      );
    }
    return this.instance;
  }

  public latestRollupOffChainWithTransitionLog(
    filter: Partial<TRollupOffChainRecord>,
    session: ClientSession
  ): AggregationCursor<TRollupOffChainTransitionAggregate> {
    return this.collection.aggregate<TRollupOffChainTransitionAggregate>(
      [
        {
          $match: filter,
        },
        {
          $sort: { step: -1 },
        },
        {
          $lookup: {
            from: zkDatabaseConstant.globalCollection.transaction,
            localField: 'transitionLogObjectId',
            foreignField: '_id',
            as: 'transitionLog',
          },
        },
        {
          $addFields: {
            // It's 1-1 relation so the array must have 1 element
            transitionLog: { $arrayElemAt: ['$transitionLog', 0] },
          },
        },
        { $limit: 1 },
      ],
      {
        session,
      }
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TRollupOffChainRecord>(
      zkDatabaseConstant.globalMinaDatabase,
      DATABASE_ENGINE.dbMina,
      zkDatabaseConstant.globalCollection.rollupOffChain
    );

    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { proof: 1 },
        { unique: true, session }
      );

      await collection.createSystemIndex({ databaseName: 1 }, { session });

      await collection.createSystemIndex({ merkleRootNew: 1 }, { session });

      await collection.createSystemIndex({ merkleRootOld: 1 }, { session });

      await collection.addTimestampMongoDb({ session });
    }
  }
}
