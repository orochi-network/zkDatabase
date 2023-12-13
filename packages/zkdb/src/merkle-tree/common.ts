import { Field } from 'o1js';

export interface MerkleProof {
  sibling: Field;
  isLeft: boolean;
}
