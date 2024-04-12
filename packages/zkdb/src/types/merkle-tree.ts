import { Field } from "o1js"

export type MerkleWitness = {
  isLeft: boolean,
  sibling: Field
}[]