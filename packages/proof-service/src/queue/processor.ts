import { MerkleWitness, ZkProgram } from 'o1js';
import { ITaskQueue, Task } from './i-task-queue.js';
import { ModelDbSetting, ModelMerkleTree, ModelProof } from '@zkdb/storage';
import CircuitFactory from '../proof-system/circuit-factory.js';

export default class TaskQueueProcessor {
  private isRunning = true;

  constructor(private taskQueue: ITaskQueue) {}

  async processTasks(callback?: (task: Task | null) => void): Promise<void> {
    while (this.isRunning) {
      const task = await this.taskQueue.getNextTask();

      if (task) {
        const circuitName = `${task.database}.${task.collection}`;

        const merkleHeight = await ModelDbSetting.getInstance(
          task.database
        ).getHeight();

        if (!merkleHeight) {
          throw Error('Merkle Tree height is null');
        }

        const merkleTree = ModelMerkleTree.getInstance(task.database);
        merkleTree.setHeight(merkleHeight);

        if (!CircuitFactory.contains(circuitName)) {
          await CircuitFactory.createCircuit(circuitName, merkleHeight);
        }

        const circuit = CircuitFactory.getCircuit(circuitName).getProgram();

        class RollUpProof extends ZkProgram.Proof(circuit) {}

        class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

        const modelProof = ModelProof.getInstance();

        const zkProof = await modelProof.getProof(
          task.database,
          task.collection
        );

        let proof: RollUpProof | undefined = undefined;

        if (zkProof) {
          proof = RollUpProof.fromJSON(zkProof);
        }

        const witness = new DatabaseMerkleWitness(
          await merkleTree.getWitness(task.merkleIndex, new Date(task.createdAt.getTime() - 1))
        );
        const merkleRoot = await merkleTree.getRoot(new Date(task.createdAt.getTime() - 1));
        const oldLeaf = await merkleTree.getNode(
          0,
          task.merkleIndex,
          new Date(task.createdAt.getTime() - 1)
        );

        if (!proof) {
          proof = await circuit.init(merkleRoot, witness, oldLeaf, task.hash);
        } else {
          proof = await circuit.update(
            merkleRoot,
            proof,
            witness,
            oldLeaf,
            task.hash
          );
        }

        if (proof) {
          await modelProof.saveProof({
            ...proof.toJSON(),
            database: task.database,
            collection: task.collection,
          });
          await this.taskQueue.markTaskProcessed(task);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      if (callback !== undefined) {
        callback(task);
      }
    }
  }

  public stop() {
    this.isRunning = false;
  }
}
