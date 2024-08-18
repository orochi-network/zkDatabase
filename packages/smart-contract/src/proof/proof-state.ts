import { Bool, Field, Struct } from 'o1js';

export class ProofStateInput extends Struct({
  previousOnChainState: Field,
  currentOnChainState: Field,
  currentOffChainState: Field
}) {}

export class ProofStateOutput extends Struct({
  newOffChainState: Field,
  onChainState: Field, // should be equal to currentOnChainState if it is not a transition
  isTransition: Bool
}) {}
