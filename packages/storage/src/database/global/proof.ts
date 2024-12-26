import { zkDatabaseConstant } from '@common';
import {
  addTimestampMongoDB,
  createSystemIndex,
  DATABASE_ENGINE,
} from '@helper';
import { TProofRecord } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';
import { ZkDbMongoIndex } from '../../helper/system-index';

export class ModelProof extends ModelGeneral<OptionalId<TProofRecord>> {
  public static instance: ModelProof;

  public static getInstance(): ModelProof {
    if (!this.instance) {
      this.instance = new ModelProof(
        zkDatabaseConstant.globalProofDatabase,
        DATABASE_ENGINE.proofService,
        zkDatabaseConstant.globalCollection.proof
      );
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TProofRecord>(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.proof
    );

    if (!(await collection.isExist())) {
      await createSystemIndex(
        collection,
        { proof: 1 },
        { unique: true, session }
      );

      await createSystemIndex(collection, { databaseName: 1 }, { session });

      await createSystemIndex(
        collection,
        { databaseName: 1, collectionName: 1 },
        { unique: true, session }
      );

      await createSystemIndex(
        collection,
        { merkleRoot: 1 },
        { unique: true, session }
      );

      await createSystemIndex(
        collection,
        { merkleRootPrevious: 1 },
        { unique: true, session }
      );

      await addTimestampMongoDB(collection, session);
    }
  }
}
