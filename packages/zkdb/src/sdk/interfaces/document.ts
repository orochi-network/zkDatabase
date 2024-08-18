/* eslint-disable no-unused-vars */
import { MerkleWitness } from '../../types/merkle-tree.js';
import { Ownable } from '../query/interfaces/ownable.js';
import { DocumentEncoded } from '../schema.js';

export interface ZKDocument extends Ownable {
  getWitness(): Promise<MerkleWitness>;
  toSchema<
    T extends {
      new (..._args: any): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(type: T): InstanceType<T>;
}
