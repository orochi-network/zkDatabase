import { TProofRecord } from '@zkdb/common';
import {
  ClientSession,
  FindOptions,
  InsertOneOptions,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { addTimestampMongoDB } from '../../helper/common.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

export class ModelProof extends ModelGeneral<WithoutId<TProofRecord>> {
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

  public async saveProof(
    proof: WithoutId<TProofRecord>,
    options?: InsertOneOptions
  ): Promise<boolean> {
    try {
      await this.collection.insertOne(proof, options);
      return true;
    } catch (error) {
      logger.error('Error saving proof:', error);
      return false;
    }
  }

  public async getProof(
    database: string,
    options?: FindOptions
  ): Promise<TProofRecord | null> {
    return this.collection.findOne(
      { database },
      { ...options, sort: { createdAt: -1 } }
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TProofRecord>(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.proof
    );

    /*
      publicInput: string[];
      publicOutput: string[];
      maxProofsVerified: 0 | 1 | 2;
      proof: string;
      createdAt?: Date;
      databaseName: string;
      collectionName: string;
      merkleRoot: string;
      prevMerkleRoot: string;
    */
    if (!(await collection.isExist())) {
      await collection.index({ proof: 1 }, { unique: true, session });
      await collection.index({ databaseName: 1 }, { session });
      await collection.index(
        { databaseName: 1, collectionName: 1 },
        { unique: true, session }
      );
      await collection.index({ merkleRoot: 1 }, { unique: true, session });
      await collection.index({ prevMerkleRoot: 1 }, { unique: true, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}
