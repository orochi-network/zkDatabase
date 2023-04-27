import { Field } from 'snarkyjs';

export default interface MerkleProof {
  sibling: Field;
  isLeft: boolean;
}
