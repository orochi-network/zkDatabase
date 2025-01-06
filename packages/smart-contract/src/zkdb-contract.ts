import {
  AccountUpdate,
  Field,
  MerkleTree,
  Permissions,
  SmartContract,
  State,
  ZkProgram,
  method,
  state,
} from 'o1js';
import { ZkDbRollup } from './zkdb-rollup.js';

export type ZkDbContract = ReturnType<typeof ZkDbContractFactory>;

export function ZkDbContractFactory(
  merkleHeight: number,
  zkDbRollup: ZkDbRollup
) {
  const merkleTree = new MerkleTree(merkleHeight);

  class ZkDbRollupProof extends ZkProgram.Proof(zkDbRollup) {}

  class ZkDbSmartContract extends SmartContract {
    @state(Field) merkleRoot = State<Field>();
    @state(Field) step = State<Field>();

    init() {
      super.init();

      this.account.permissions.set({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });

      this.merkleRoot.set(merkleTree.getRoot());

      this.step.set(Field(0));
    }

    @method async rollUp(zkRollupProof: ZkDbRollupProof) {
      zkRollupProof.verify();

      this.merkleRoot.getAndRequireEquals();

      const step = this.step.getAndRequireEquals();

      step.assertLessThan(zkRollupProof.publicOutput.step);

      this.merkleRoot.set(zkRollupProof.publicOutput.merkleRoot);

      this.step.set(zkRollupProof.publicOutput.step);

      // TODO: Why do we need this?
      AccountUpdate.createSigned(this.address);
    }
  }

  return ZkDbSmartContract;
}
