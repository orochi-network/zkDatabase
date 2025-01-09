/* eslint-disable no-await-in-loop */

import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TDbRecord, TMerkleProof } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export type TTransitionProof = {
  merkleRootNew: string;
  merkleProof: TMerkleProof[];
  leafOld: string;
  leafNew: string;
  operationNumber: number;
};

export type TTransitionProofRecord = TDbRecord<TTransitionProof>;

export class ModelTransitionProof extends ModelGeneral<
  OptionalId<TTransitionProofRecord>
> {
  private static instances = new Map<string, ModelTransitionProof>();

  private constructor(databaseName: string) {
    super(
      zkDatabaseConstant.globalTransitionProofDatabase,
      DATABASE_ENGINE.proofService,
      databaseName
    );
  }

  public static async getInstance(
    databaseName: string
  ): Promise<ModelTransitionProof> {
    if (!ModelTransitionProof.instances.has(databaseName)) {
      ModelTransitionProof.instances.set(
        databaseName,
        new ModelTransitionProof(databaseName)
      );
      ModelTransitionProof.init(databaseName);
    }
    return ModelTransitionProof.instances.get(databaseName)!;
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalTransitionProofDatabase,
      DATABASE_ENGINE.proofService,
      databaseName
    );
    if (!(await collection.isExist())) {
      // TODO: are there any other indexes that need to be created?
      await collection.createSystemIndex(
        { operationNumber: 1 },
        { unique: true, session }
      );
      await collection.addTimestampMongoDb({ session });
    }
  }
}

export default ModelTransitionProof;
