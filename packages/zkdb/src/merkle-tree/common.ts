import { Field } from 'snarkyjs';

export interface IPDLNode {
  level: number;
  index: string;
  hash: Field;
  leftChildDocumentId: string | null;
  rightChildDocumentId: string | null;
}

export interface MerkleProof {
  sibling: Field;
  isLeft: boolean;
}
