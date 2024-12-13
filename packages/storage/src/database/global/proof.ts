import { FindOptions, InsertOneOptions, WithId, WithoutId } from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelGeneral from '../base/general.js';
import { TProofRecord } from '@zkdb/common';

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
    proofDetails: TProofRecord,
    options?: InsertOneOptions
  ): Promise<boolean> {
    try {
      await this.collection.insertOne(
        {
          ...proofDetails,
          createdAt: new Date(),
        },
        options
      );
      return true;
    } catch (error) {
      logger.error('Error saving proof:', error);
      return false;
    }
  }

  public async getProof(
    database: string,
    options?: FindOptions
  ): Promise<WithId<TProofRecord> | null> {
    const proof = await this.collection.findOne(
      { database },
      { ...options, sort: { createdAt: -1 } }
    );
    return proof as WithId<TProofRecord> | null;
  }
}
