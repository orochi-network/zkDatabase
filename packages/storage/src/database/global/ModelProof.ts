import {
  ZKDATABASE_DB_PROOF_COLLECTION,
  ZKDATABASE_GLOBAL_DB,
} from '../../common/const.js';
import logger from '../../helper/logger.js';
import ModelBasic from '../base/basic.js';

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
};

export type ProofDetails = ZKProof & ProofMetadata;

export class ModelProof extends ModelBasic<ProofDetails> {
  public static instance: ModelProof;

  public static getInstance(): ModelProof {
    if (!this.instance) {
      this.instance = new ModelProof(
        ZKDATABASE_GLOBAL_DB,
        ZKDATABASE_DB_PROOF_COLLECTION
      );
    }
    return this.instance;
  }

  public async saveProof(proofDetails: ProofDetails): Promise<boolean> {
    try {
      await this.collection.insertOne({
        ...proofDetails,
        createdAt: new Date(),
      });
      return true;
    } catch (error) {
      logger.error('Error saving proof:', error);
      return false;
    }
  }

  public async getProof(
    database: string,
    collection: string
  ): Promise<ZKProof | null> {
    const proof = await this.collection.findOne(
      { database, collection },
      { sort: { createdAt: -1 } }
    );
    return proof as ProofDetails | null;
  }
}