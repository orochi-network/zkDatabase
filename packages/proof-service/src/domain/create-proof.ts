import { Field, MerkleWitness, ZkProgram } from 'o1js';
import {
  ModelDbSetting,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
} from '@zkdb/storage';
import CircuitFactory from '../circuit/circuit-factory.js';
import { ObjectId } from 'mongodb';
import logger from '../helper/logger.js';

export async function createProof(taskId: string) {
  if (taskId === undefined) {
    throw Error('Passed ID is undefined')
  }
  
  const queue = ModelQueueTask.getInstance();

  const task = await queue.getQueuedTask({
    _id: new ObjectId(taskId),
  });

  if (!task) {
    logger.error('Task has not been found');
    process.exit(1);
  }

  try {
    const circuitName = `${task.database}.${task.collection}`;
    const merkleHeight = await ModelDbSetting.getInstance(
      task.database
    ).getHeight();

    if (!merkleHeight) {
      throw new Error('Merkle Tree height is null');
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
    const zkProof = await modelProof.getProof(task.database, task.collection);
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
    await queue.markTaskProcessed(task.merkleIndex);

    console.log('Task processed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error processing task:', error);
    process.exit(1);
  }
}