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

    init() {
      super.init();

      this.account.permissions.set({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });

      this.merkleRoot.set(merkleTree.getRoot());
    }

    @method async rollUp(zkRollupProof: ZkDbRollupProof) {
      zkRollupProof.verify();

      const merkleRoot = this.merkleRoot.getAndRequireEquals();

      merkleRoot.assertEquals(zkRollupProof.publicOutput.merkleRootOnChain);

      this.merkleRoot.set(zkRollupProof.publicOutput.merkleRoot);

      AccountUpdate.createSigned(this.address);
    }
  }

  return ZkDbSmartContract;
}
