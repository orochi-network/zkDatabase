import { ClientSession, FindOptions, InsertOneOptions, WithId } from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

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
        zkDatabaseConstant.globalProofDatabase,
        DB.proof,
        zkDatabaseConstant.globalCollection.proof
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

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<ProofDetails>(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.proof
    );
    if (!(await collection.isExist())) {
      collection.index({ proof: 1 }, { unique: true, session });
      collection.index(
        { database: 1, collection: 1 },
        { unique: true, session }
      );
      collection.index({ merkleRoot: 1 }, { unique: true, session });
      collection.index({ prevMerkleRoot: 1 }, { unique: true, session });
    }
  }
}
