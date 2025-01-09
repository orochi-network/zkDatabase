/* eslint-disable no-await-in-loop */

import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TDbRecord, TMerkleProof } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { Field, Poseidon } from 'o1js';
import { ModelGeneral } from '../base';
import { ModelMetadataDatabase } from '../global';
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

  private zeroes: Field[] = [];

  private _height: number = 0;

  private generateZeroNode(height: number) {
    const zeroes = new Array<Field>(height);
    zeroes[0] = Field(0n);
    for (let i = 1; i < height; i += 1) {
      zeroes[i] = Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]);
    }

    this.zeroes = zeroes;
  }

  private constructor(databaseName: string, height: number) {
    super(
      zkDatabaseConstant.globalTransitionProofDatabase,
      DATABASE_ENGINE.proofService,
      databaseName
    );
    this._height = height;
    this.generateZeroNode(this._height);
  }

  public static async getInstance(
    databaseName: string
  ): Promise<ModelTransitionProof> {
    if (!ModelTransitionProof.instances.has(databaseName)) {
      const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();
      const metadataDatabase = await modelDatabaseMetadata.findOne({
        databaseName,
      });
      if (!metadataDatabase) {
        throw new Error(`Metadata of ${databaseName} has not been found.`);
      }
      ModelTransitionProof.instances.set(
        databaseName,
        new ModelTransitionProof(databaseName, metadataDatabase?.merkleHeight)
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
        { level: 1, index: 1 },
        { unique: true, session }
      );
      await collection.addTimestampMongoDb({ session });
    }
  }
}

export default ModelTransitionProof;
