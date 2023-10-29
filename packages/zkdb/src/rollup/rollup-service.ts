import { Bool, MerkleTree, Provable } from 'o1js';
import { IRollupContract } from './rollup-contract.js';
import { ZKDatabaseStorage } from '../core/zkdb-storage.js';
import { RollUpInput } from './rollup-params.js';
import { OffchainRollUp, RollUpProof } from './offchain-rollup.js';
import { DatabaseMerkleWitness } from '../core/database-witness.js';
import { Credentials } from '../models/credentials.js';

export class RollupService {
  private static INSTANCE: RollupService;

  private rollupContract: IRollupContract;
  private storage: ZKDatabaseStorage;
  private credentials: Credentials;
  private merkleTree: MerkleTree;

  private constructor(
    rollupContract: IRollupContract,
    storage: ZKDatabaseStorage,
    credentials: Credentials
  ) {
    this.rollupContract = rollupContract;
    this.storage = storage;
    this.credentials = credentials;
  }

  static get(): RollupService {
    const isInitialized = Provable.witness(Bool, () =>
      Bool(this.INSTANCE !== undefined)
    );
    isInitialized.assertTrue();
    return this.INSTANCE;
  }

  static async activate(
    rollupContract: IRollupContract,
    storage: ZKDatabaseStorage,
    credentials: Credentials
  ): Promise<RollupService> {
    if (this.INSTANCE === undefined) {
      this.INSTANCE = new RollupService(rollupContract, storage, credentials);
      this.INSTANCE.cacheMerkleTree();
    }
    return this.INSTANCE;
  }

  private cacheMerkleTree() {
    this.merkleTree = this.storage.getMerkleTree();
  }

  public getMerkleTree(): MerkleTree {
    return this.merkleTree;
  }

  public getCredentials(): Credentials {
    return this.credentials;
  }

  public async rollUp(batchSize: number): Promise<void> {
    const currentActionState = this.rollupContract.getActionState();
    const merkleRoot = this.rollupContract.getState();

    const actions = await this.rollupContract.getUnprocessedActions(batchSize);

    const rollUpInput = new RollUpInput({
      onChainActionState: currentActionState,
      onChainRoot: merkleRoot,
    });

    await OffchainRollUp.compile();

    const cachedMerkleTree = this.merkleTree;

    let proof: RollUpProof | undefined = undefined;

    const depth = batchSize > actions.length ? actions.length : batchSize;

    console.log('Recursion');
    for (let i = 0; i < depth; i++) {
      console.log(`depth : ${i}`);
      const action = actions[i];
      const oldLeaf = cachedMerkleTree.getNode(0, action.index.toBigInt());
      const witness = new DatabaseMerkleWitness(
        cachedMerkleTree.getWitness(action.index.toBigInt())
      );

      if (i === 0) {
        console.log('init');
        proof = await OffchainRollUp.init(
          rollUpInput,
          oldLeaf,
          action,
          witness
        );
      } else {
        console.log('update');
        proof = await OffchainRollUp.update(
          rollUpInput,
          proof!,
          oldLeaf,
          action,
          witness
        );
      }

      cachedMerkleTree.setLeaf(action.index.toBigInt(), action.hash);
    }

    if (proof !== undefined) await this.rollupContract.rollUp(proof);
  }
}
