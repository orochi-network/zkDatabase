/* eslint-disable no-unused-vars */

import { MerkleWitness, ProofStatus } from '../../types';
import { DocumentEncoded } from '../schema';
import { Ownable } from './ownable';

export interface ZKDocument {
  get id(): string;

  get encoded(): DocumentEncoded;

  get createdAt(): Date;

  get ownership(): Ownable;

  drop(): Promise<MerkleWitness>;

  toSchema<
    T extends {
      new (..._args: any): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(
    type: T
  ): InstanceType<T>;

  getWitness(): Promise<MerkleWitness>;

  getProofStatus(): Promise<ProofStatus>;

  getDocumentHistory(): Promise<ZKDocument[]>;
}
