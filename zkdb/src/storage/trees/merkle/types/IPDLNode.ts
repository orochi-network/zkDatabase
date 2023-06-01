import { Field } from 'snarkyjs';

export default interface IPDLNode {
  level: number;
  index: string;
  hash: Field;
  leftChildDocumentId: string | null;
  rightChildDocumentId: string | null;
}
