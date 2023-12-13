/* eslint-disable o1js/no-if-in-circuit */
import {
  AccountUpdate,
  ZkProgram,
  Field,
  MerkleWitness,
  SmartContract,
  method,
  Provable,
  Mina,
  PublicKey,
  UInt64,
} from 'o1js';
import { Action } from '../rollup/action.js';
import { getDatabaseZkApp } from './zkdb-contract.js';
import { RollUpInput } from '../rollup/rollup-params.js';
import { ZKDatabaseStorage } from './zkdb-storage.js';
import { getDatabaseRollUpFunction } from '../rollup/rollup-program.js';
import { Schema } from './schema.js';

export class ZKDatabase {
  static SmartContract<T>(
    type: Provable<T>,
    storage: ZKDatabaseStorage,
    publicKey: PublicKey
  ) {
    const merkleHeight = storage.getMerkleTree().height;

    const cachedMerkleTree = storage.getMerkleTree();

    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    const rollUpProgram = getDatabaseRollUpFunction('', merkleHeight);

    const DatabaseContract = getDatabaseZkApp(type, rollUpProgram.getProgram());

    class RollUpProof extends ZkProgram.Proof(rollUpProgram.getProgram()) {}

    class CoreDatabaseSmartContract extends DatabaseContract.getZkApp() {}

    const zkdbSmartContract = new CoreDatabaseSmartContract(publicKey);

    class Document extends Schema({ data: type }) {}

    abstract class ZKDatabaseSmartContract extends SmartContract {
      protected createDocument(entity: T) {
        return new Document({
          data: entity,
        });
      }

      @method insert(index: UInt64, document: Document) {
        new CoreDatabaseSmartContract(publicKey).insert(index, document);
      }

      async deployZkDatabaseContract(
        feePayer: PublicKey
      ): Promise<Mina.Transaction> {
        await rollUpProgram.compile();
        await DatabaseContract.compile();
        const merkleRoot = await storage.getMerkleRoot();

        zkdbSmartContract.setMerkleRoot(merkleRoot);

        return await Mina.transaction(feePayer, () => {
          AccountUpdate.fundNewAccount(feePayer);
          zkdbSmartContract.deploy();
        });
      }

      async rollUp(
        feePayer: PublicKey,
        batchSize: number
      ): Promise<Mina.Transaction | null> {
        await rollUpProgram.compile();

        const currentActionState = this.getActionState();
        const merkleRoot = this.getState();

        const actions = await this.getUnprocessedActions(batchSize);

        const rollUpInput = new RollUpInput({
          onChainActionState: currentActionState,
          onChainRoot: merkleRoot,
        });

        let proof: RollUpProof | undefined = undefined;

        const depth = batchSize > actions.length ? actions.length : batchSize;

        for (let i = 0; i < depth; i++) {
          const action = actions[i];
          const oldLeaf = cachedMerkleTree.getNode(0, action.index.toBigInt());
          const witness = new DatabaseMerkleWitness(
            cachedMerkleTree.getWitness(action.index.toBigInt())
          );

          if (i === 0) {
            proof = await rollUpProgram
              .getProgram()
              .init(rollUpInput, action, witness, oldLeaf);
          } else {
            proof = await rollUpProgram
              .getProgram()
              .update(rollUpInput, proof!, action, witness, oldLeaf);
          }

          cachedMerkleTree.setLeaf(action.index.toBigInt(), action.hash);
        }

        if (proof) {
          const tx = await Mina.transaction(feePayer, () => {
            zkdbSmartContract.rollup(proof!);
          });

          await tx.prove();

          return tx;
        } else {
          return null;
        }
      }

      getState(): Field {
        return zkdbSmartContract.rootCommitment.get();
      }

      getActionState(): Field {
        return zkdbSmartContract.currentActionState.get();
      }

      async getUnprocessedActions(size: number): Promise<Action[]> {
        const fromActionState = this.getActionState();

        return (
          await zkdbSmartContract.reducer.fetchActions({ fromActionState })
        )
          .slice(0, size)
          .map((action) => action[0]);
      }
    }

    return ZKDatabaseSmartContract;
  }
}
