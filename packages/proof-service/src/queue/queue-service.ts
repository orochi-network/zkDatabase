import { Field, MerkleWitness, ZkProgram } from 'o1js';
import {
  ModelDbSetting,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
} from '@zkdb/storage';
import CircuitFactory from '../circuit/circuit-factory.js';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class QueueService {
  private isRunning = true;
  private isIdle = false;
  private processingComplete = true;

  constructor(private queue: ModelQueueTask) {}

  get running(): boolean {
    return this.isRunning;
  }

  get idle(): boolean {
    return this.isIdle;
  }

  private async processNext(): Promise<void> {
    this.processingComplete = false;

    while (this.isRunning) {
      const task = await this.queue.getNewTask();

      if (!task) {
        this.isIdle = true;
        await sleep(1000);
        continue;
      }
      
      this.isIdle = false;

      try {
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
        let proof = zkProof ? RollUpProof.fromJSON(zkProof) : undefined;

        const witness = new DatabaseMerkleWitness(
          await merkleTree.getWitness(
            task.merkleIndex,
            new Date(task.createdAt.getTime() - 1)
          )
        );
        const merkleRoot = await merkleTree.getRoot(
          new Date(task.createdAt.getTime() - 1)
        );
        const oldLeaf = await merkleTree.getNode(
          0,
          task.merkleIndex,
          new Date(task.createdAt.getTime() - 1)
        );

        proof = proof
          ? await circuit.update(
              merkleRoot,
              proof,
              witness,
              oldLeaf,
              Field(task.hash)
            )
          : await circuit.init(merkleRoot, witness, oldLeaf, Field(task.hash));

        await modelProof.saveProof({
          ...proof.toJSON(),
          database: task.database,
          collection: task.collection,
        });
        await this.queue.markTaskProcessed(task.merkleIndex);
      } catch (error) {
        console.error('Error processing task:', error);
      }
    }

    this.processingComplete = true;
  }

  public async start() {
    this.isRunning = true;
    this.processNext();
  }

  public async stop() {
    this.isRunning = false;

    while (!this.processingComplete) {
      await sleep(100);
    }
  }
}
