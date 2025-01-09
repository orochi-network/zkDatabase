import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TRollUpOffChainRecord } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupOffChain extends ModelGeneral<
  OptionalId<TRollUpOffChainRecord>
> {
  public static instance: ModelRollupOffChain;

  public static getInstance(): ModelRollupOffChain {
    if (!this.instance) {
      this.instance = new ModelRollupOffChain(
        zkDatabaseConstant.globalProofDatabase,
        DATABASE_ENGINE.proofService,
        zkDatabaseConstant.globalCollection.proof
      );
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TRollUpOffChainRecord>(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.proof
    );

    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { proof: 1 },
        { unique: true, session }
      );

      await collection.createSystemIndex({ databaseName: 1 }, { session });

      await collection.createSystemIndex(
        { merkleRootNew: 1 },
        { unique: true, session }
      );

      await collection.createSystemIndex(
        { merkleRootOld: 1 },
        { unique: true, session }
      );

      await collection.createSystemIndex(
        { merkleRootOld: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}
