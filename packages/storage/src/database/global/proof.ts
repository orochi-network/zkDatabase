import { FindOptions, InsertOneOptions } from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import logger from '../../helper/logger.js';
import ModelGeneral from '../base/general.js';
import { NetworkId } from './network.js';

export type ZKProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
};

export type ProofMetadata = {
  createdAt?: Date;
  databaseName: string;
  collectionName: string;
  networkId: NetworkId;
  merkleRoot: string;
};

export type ProofDetails = ZKProof & ProofMetadata;

export class ModelProof extends ModelGeneral<ProofDetails> {
  public static instance: ModelProof;

  public static getInstance(): ModelProof {
    if (!this.instance) {
      this.instance = new ModelProof(
        zkDatabaseConstants.globalDatabase,
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
    networkId: NetworkId,
    databaseName: string,
    options?: FindOptions
  ): Promise<ZKProof | null> {
    const proof = await this.collection.findOne(
      { databaseName, networkId },
      { ...options, sort: { createdAt: -1 } }
    );
    return proof as ProofDetails | null;
  }
}
