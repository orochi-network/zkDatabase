import { Field, Struct } from "o1js";

export class ProofState extends Struct({
  actionState: Field,
  rootState: Field
}) {
}