import logger from '../helper/logger.js';
import ModelBasic from './abstract/basic.js';

export type ZkProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
  createdAt?: Date;
};

export class ModelProof extends ModelBasic {
  public static instances = new Map<string, ModelProof>();

  public static getInstance(collectionName: string) {
    const key = `${collectionName}`;
    if (!ModelProof.instances.has(key)) {
      ModelProof.instances.set(
        key,
        new ModelProof('ProofStorage', collectionName)
      );
    }
    return ModelProof.instances.get(key);
  }

  public async saveProof(proof: ZkProof): Promise<boolean> {
    try {
      await this.collection.insertOne({
        ...proof,
        createdAt: new Date(),
      });
      return true;
    } catch (error) {
      logger.error('Error saving proof:', error);
      return false;
    }
  }

  public async getProof(): Promise<ZkProof | null> {
    const proof = await this.collection.findOne(
      {},
      { sort: { createdAt: -1 } }
    );
    return proof as ZkProof | null;
  }
}
