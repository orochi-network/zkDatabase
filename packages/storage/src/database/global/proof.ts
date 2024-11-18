import { FindOptions, InsertOneOptions } from 'mongodb';
import { ModelGeneral } from '../base';
import { DatabaseEngine } from '../database-engine';
import { zkDatabaseConstants } from '@common';
import { logger } from '@helper';

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
  private static dbEngine: DatabaseEngine;

  public static createModel(dbEngine: DatabaseEngine) {
    ModelProof.dbEngine = dbEngine;
  }
  public static getInstance(): ModelProof {
    if (!this.instance) {
      this.instance = new ModelProof(
        zkDatabaseConstants.globalProofDatabase,
        ModelProof.dbEngine,
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
  ): Promise<ProofDetails | null> {
    const proof = await this.collection.findOne(
      { database },
      { ...options, sort: { createdAt: -1 } }
    );
    return proof as ProofDetails | null;
  }
}
