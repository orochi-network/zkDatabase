import logger from '../helper/logger.js';
import ModelBasic from './abstract/basic.js';

export type ZkProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
};

export class ModelProof extends ModelBasic {
  public static instances = new Map<string, ModelProof>();

  public static getInstance(databaseName: string, collectionName: string) {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelProof.instances.has(key)) {
      ModelProof.instances.set(
        key,
        new ModelProof(databaseName, collectionName)
      );
    }
    return ModelProof.instances.get(key);
  }

  public async saveProof(proof: ZkProof): Promise<boolean> {
    try {
      const existingProof = await this.collection.findOne({});
      if (existingProof) {
        await this.collection.updateOne({}, { $set: proof });
      } else {
        await this.collection.insertOne(proof);
      }
      return true;
    } catch (error) {
      logger.error('Error saving proof:', error);
      return false;
    }
  }

  public async getProof(): Promise<ZkProof | null> {
    const proof = await this.collection.findOne({});
    return proof as ZkProof | null;
  }
}
