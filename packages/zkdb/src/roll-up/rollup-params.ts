import { Field, Struct } from "o1js";

export class RollUpInput extends Struct({
  onChainActionState: Field,
  onChainRoot: Field
}) {
}

export class RollUpOutput extends Struct({
  newActionState: Field,
  newRoot: Field
}) {}