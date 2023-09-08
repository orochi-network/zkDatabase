import { SmartContract, State, state, method, Field } from 'o1js';
import { IDocument } from './common.js';

// we need the initiate tree root in order to tell the contract about our off-chain storage
let initialCommitment: Field;

export class ZKDatabaseContract extends SmartContract {
  // a commitment is a cryptographic primitive that allows us to commit to data,
  // with the ability to "reveal" it later
  @state(Field) root = State<any>();

  @method init() {
    super.init();
    this.root.set(initialCommitment);
  }

  updateState(
    proofs: {
      oldRecord: IDocument;
      newRecord: IDocument;
      merkleWitness: any;
    }[]
  ) {
    // We fetch the on-chain merkle root commitment,
    // Make sure it matches the one we have locally
    const commitment = this.root.get();
    this.root.assertEquals(commitment);

    let newCommitment: Field = commitment;

    for (let i = 0; i < proofs.length; i += 1) {
      // We check that the oldRecord is within the committed Merkle Tree
      proofs[i].merkleWitness
        .calculateRoot(proofs[i].oldRecord.hash())
        .assertEquals(newCommitment);

      // We calculate the new Merkle Root, based on the record changes
      newCommitment = proofs[i].merkleWitness.calculateRoot(
        proofs[i].newRecord.hash()
      );
    }

    this.root.set(newCommitment);
  }
}

export function initZKDatabase(initialRoot: Field) {
  // We initialize the contract with a commitment of 0
  initialCommitment = initialRoot;
}
