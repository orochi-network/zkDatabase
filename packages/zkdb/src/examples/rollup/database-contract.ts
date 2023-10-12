import {
  Field,
  SmartContract,
  State,
  state,
  Reducer,
  method,
  UInt64,
  AccountUpdate,
  Provable
} from 'o1js';
import { User } from './user.js';
import { Action } from '../../roll-up/action.js';
import { RollUpProof } from '../../roll-up/offchain-rollup.js';

let initialCommitment: Field = new Field(0);

/*Example*/
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
    this.rootCommitment.set(initialCommitment);
  }

  @method insert(index: UInt64, user: User) {
    this.reducer.dispatch(
      new Action({
        type: Field(0),
        index: index,
        hash: user.hash(),
      })
    );
    this.emitEvent('INSERT', user.hash());
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

    proof.publicOutput.newActionState.assertEquals(proof.publicOutput.newActionState);

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
}

export function initZKDatabase(initialRoot: Field) {
  // We initialize the contract with a commitment of 0
  initialCommitment = initialRoot;
}
