import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TRollupOffChainRecord } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupOffChain extends ModelGeneral<
  OptionalId<TRollupOffChainRecord>
> {
  public static instance: ModelRollupOffChain;

  public static getInstance(): ModelRollupOffChain {
    if (!this.instance) {
      this.instance = new ModelRollupOffChain(
        zkDatabaseConstant.globalProofDatabase,
        DATABASE_ENGINE.dbMina,
        zkDatabaseConstant.globalCollection.rollupOffChain
      );
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TRollupOffChainRecord>(
      zkDatabaseConstant.globalProofDatabase,
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
