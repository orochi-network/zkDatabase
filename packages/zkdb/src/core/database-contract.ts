import {
  Field,
  SmartContract,
  State,
  state,
  Reducer,
  method,
  UInt64,
  AccountUpdate,
  Provable,
  Mina
} from 'o1js';
import { Action } from '../rollup/action.js';
import { RollUpProof } from '../rollup/offchain-rollup.js';
import { RollupService } from '../rollup/rollup-service.js';

export class DatabaseContract extends SmartContract {
  @state(Field) rootCommitment = State<Field>();
  @state(Field) currentActionState = State<Field>();

  reducer = Reducer({ actionType: Action });

  events = {
    INSERT: Field,
    REMOVE: Field,
  };

  @method init() {
    this.account.provedState.assertEquals(this.account.provedState.get());
    this.account.provedState.get().assertFalse();

    super.init();

    this.currentActionState.set(Reducer.initialActionState);
    const merkleTreeRoot = Provable.witness(Field, () => RollupService.get().getMerkleTree().getRoot())
    this.rootCommitment.set(merkleTreeRoot);
  }

  // TODO: Figured out how to replace the Field with IDocument / ISchema, which must be provable 
  @method insert(index: UInt64, hash: Field) {
    this.reducer.dispatch(
      new Action({
        type: Field(0),
        index: index,
        hash: hash,
      })
    );
    this.emitEvent('INSERT', hash);
  }

  @method remove(index: UInt64) {
    this.reducer.dispatch(
      new Action({
        type: Field(1),
        index: index,
        hash: Field(0),
      })
    );
    this.emitEvent('REMOVE', index.toFields()[0]);
  }

  @method rollup(proof: RollUpProof) {
    this.rootCommitment.getAndAssertEquals();
    this.currentActionState.getAndAssertEquals();

    proof.verify();
    
    this.rootCommitment.assertEquals(proof.publicInput.onChainRoot);
    this.currentActionState.assertEquals(proof.publicInput.onChainActionState);

    // If we have no error we can garantee that action state is truthworthy
    this.reducer.getActions({
      fromActionState: this.currentActionState.get(),
      endActionState: proof.publicOutput.newActionState,
    });

    // const newActionState = Provable.witness(Field, () => pendingActions.reduce((oldActionState, actions) => {
    //   const action = actions[0];
    //   const actionsHash = AccountUpdate.Actions.hash([Action.toFields(action)]);
    //   return AccountUpdate.Actions.updateSequenceState(oldActionState, actionsHash)
    // }, this.currentActionState.get()));

    // proof.publicOutput.newActionState.assertEquals(proof.publicOutput.newActionState);

    this.rootCommitment.set(proof.publicOutput.newRoot);
    this.currentActionState.set(proof.publicOutput.newActionState);
  }

  getState(): Field {
    return this.rootCommitment.get();
  }

  getActionState(): Field {
    return this.currentActionState.get();
  }

  async getUnprocessedActions(size: number): Promise<Action[]> {
    const fromActionState = this.getActionState();

    return (await this.reducer.fetchActions({ fromActionState }))
      .slice(0, size)
      .map((action) => action[0]);
  }

  getEndActionState(actions: Action[]): Field {
    let fromActionState = this.getActionState();

    for (const action of actions) {
      const actionHashs = AccountUpdate.Actions.hash([Action.toFields(action)]);
      fromActionState = AccountUpdate.Actions.updateSequenceState(
        fromActionState,
        actionHashs
      );
    }

    return fromActionState;
  }

  async rollUp(proof: RollUpProof): Promise<void> {
    const creds = RollupService.get().getCredentials();

    const tx = await Mina.transaction(creds.getFeePayer(), () => {
      this.rollup(proof);
    });

    await tx.prove();
    await tx.sign([creds.getFeePayerKey(), creds.getZkAppKey()]).send();
  }
}
