import { Field, MerkleTree, MerkleWitness, ZkProgram } from 'o1js';
import { ITaskQueue } from './ITaskQueue.js';
import {
  RollUpProxy,
  getDatabaseRollUpFunction,
} from '../proof-system/rollup-program.js';
import { ModelProof } from 'storage';
export default class TaskQueueProcessor {
  private rollUpProxy: RollUpProxy;

  constructor(private taskQueue: ITaskQueue, private merkleTree: MerkleTree) {
    this.rollUpProxy = getDatabaseRollUpFunction('', this.merkleTree.height);
  }

  async processTasks(): Promise<void> {
    console.log('Compile roll up program');
    await this.rollUpProxy.compile();

    class DatabaseMerkleWitness extends MerkleWitness(this.merkleTree.height) {}

    class RollUpProof extends ZkProgram.Proof(this.rollUpProxy.getProgram()) {}
    
    let proof: RollUpProof | undefined = undefined;

    console.log('waiting')
    while (true) {
      const task = await this.taskQueue.getNextTask();

      console.log('task', task)

      if (task) {
        console.log(`Processing task ${task.id}`);

        const modelProof = ModelProof.getInstance(task.database, task.collection)!;

        const zkProof = await modelProof.getProof();

        if (zkProof) {
          proof = RollUpProof.fromJSON(zkProof);
        }
      
        if (task.id === 1n || !proof) {
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

        await modelProof.saveProof(proof!.toJSON())
        this.merkleTree.setLeaf(task.index, Field(task.hash));
        await this.taskQueue.markTaskProcessed(task);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
