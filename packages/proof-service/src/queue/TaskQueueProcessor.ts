import { Field, MerkleWitness, ZkProgram } from 'o1js';
import { ITaskQueue } from './ITaskQueue.js';
import { ModelMerkleTree, ModelMerkleTreeMetadata, ModelProof } from 'storage';
import CircuitFactory from '../proof-system/circuit-factory.js';

export default class TaskQueueProcessor {
  constructor(private taskQueue: ITaskQueue) {}

  async processTasks(): Promise<void> {
    console.log('processing');
    while (true) {
      const task = await this.taskQueue.getNextTask();

      if (task) {
        const circuitName = `${task.database}.${task.collection}`;

        const merkleHeight = await ModelMerkleTreeMetadata.getInstance(
          task.database,
          task.collection
        ).getHeight();

        const merkleTree = ModelMerkleTree.getInstance(
          task.database,
          task.collection
        );

        if (!merkleHeight) {
          throw new Error('Merkle Tree height is null');
        }

        if (!CircuitFactory.contains(circuitName)) {
          await CircuitFactory.createCircuit(circuitName, merkleHeight);
        }

        const circuit = CircuitFactory.getCircuit(circuitName).getProgram();

        class RollUpProof extends ZkProgram.Proof(circuit) {}

        class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

        console.log(`Processing task ${task.id}`);

        const modelProof = ModelProof.getInstance(
          task.database,
          task.collection
        )!;

        const zkProof = await modelProof.getProof();

        let proof: RollUpProof | undefined = undefined;

        if (zkProof) {
          proof = RollUpProof.fromJSON(zkProof);
        }

        const merkleRoot = await merkleTree.getRoot(new Date());
        const witness = new DatabaseMerkleWitness(
          await merkleTree.getWitness(task.id, new Date())
        );

        if (task.id === 1n || !proof) {
          proof = await circuit.init(merkleRoot, witness, Field(0), task.hash);
        } else if (proof) {
          const oldLeaf = await merkleTree.getNode(0, task.index, new Date());
          proof = await circuit.update(
            merkleRoot,
            proof,
            witness,
            oldLeaf,
            task.hash
          );
        }

        if (proof) {
          await modelProof.saveProof(proof.toJSON());
          await merkleTree.setLeaf(task.index, Field(task.hash), new Date());
          await this.taskQueue.markTaskProcessed(task);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
