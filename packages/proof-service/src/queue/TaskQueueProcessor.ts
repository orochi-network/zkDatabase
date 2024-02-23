import { Field, MerkleTree, MerkleWitness, ZkProgram } from 'o1js';
import { ITaskQueue } from './ITaskQueue';
import {
  RollUpProxy,
  getDatabaseRollUpFunction,
} from '../proof-system/rollup-program';

export default class TaskQueueProcessor {
  private rollUpProxy: RollUpProxy;

  constructor(private taskQueue: ITaskQueue, private merkleTree: MerkleTree) {
    this.rollUpProxy = getDatabaseRollUpFunction('', this.merkleTree.height);
  }

  async processTasks(): Promise<void> {
    await this.rollUpProxy.compile();

    class DatabaseMerkleWitness extends MerkleWitness(this.merkleTree.height) {}

    class RollUpProof extends ZkProgram.Proof(this.rollUpProxy.getProgram()) {}

    while (true) {
      const task = await this.taskQueue.getNextTask();

      let proof: RollUpProof | undefined = undefined;

      if (task) {
        if (task.id === 1n) {
          proof = await this.rollUpProxy
            .getProgram()
            .init(
              this.merkleTree.getRoot(),
              new DatabaseMerkleWitness(this.merkleTree.getWitness(task.id)),
              Field(0),
              task.hash
            );
        } else if (proof) {
          proof = await this.rollUpProxy
            .getProgram()
            .update(
              this.merkleTree.getRoot(),
              proof,
              new DatabaseMerkleWitness(this.merkleTree.getWitness(task.id)),
              Field(0),
              task.hash
            );
        }

        this.merkleTree.setLeaf(task.index, Field(task.hash));
        await this.taskQueue.markTaskProcessed(task);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
