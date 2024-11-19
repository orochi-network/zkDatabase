import { FindOptions, InsertOneOptions, WithId } from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelGeneral from '../base/general.js';

export type ZKProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
};

export type ProofMetadata = {
  createdAt?: Date;
  database: string;
  collection: string;
  merkleRoot: string;
  prevMerkleRoot: string;
};

export type ProofDetails = ZKProof & ProofMetadata;

export class ModelProof extends ModelGeneral<ProofDetails> {
  public static instance: ModelProof;

  public static getInstance(): ModelProof {
    if (!this.instance) {
      this.instance = new ModelProof(
        zkDatabaseConstants.globalProofDatabase,
        DB.proof,
        zkDatabaseConstants.globalCollections.proof
      );
    }
    return this.instance;
  }

  public async saveProof(
    proofDetails: ProofDetails,
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
  ): Promise<WithId<ProofDetails> | null> {
    const proof = await this.collection.findOne(
      { database },
      { ...options, sort: { createdAt: -1 } }
    );
    return proof as WithId<ProofDetails> | null;
  }
}
