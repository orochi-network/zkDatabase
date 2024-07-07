import { AccountUpdate, Field, Struct, UInt64 } from "o1js";

export class Action extends Struct({
  index: UInt64,
  hash: Field
}) {
}

export function calculateActionState(oldActionState: Field, action: Action) {
  const actionsHash = AccountUpdate.Actions.hash([Action.toFields(action)]);
  const newActionState = AccountUpdate.Actions.updateSequenceState(oldActionState, actionsHash);
  return newActionState;
}
