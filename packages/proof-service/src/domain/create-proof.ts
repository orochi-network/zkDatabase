import { Field, MerkleWitness, PublicKey, UInt64, ZkProgram } from 'o1js';
import {
  ModelDbSetting,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
} from '@zkdb/storage';
import { getZkDbSmartContract, ProofState } from '@zkdb/smart-contract';
import CircuitFactory from '../circuit/circuit-factory.js';
import { ObjectId } from 'mongodb';
import logger from '../helper/logger.js';
import assert from 'assert';
import { isEmptyArray } from '../helper/utils.js';

export async function createProof(taskId: string) {
  const queue = ModelQueueTask.getInstance();

  const task = await queue.getQueuedTask({
    _id: new ObjectId(taskId),
  });

  if (!task) {
    logger.error('Task has not been found');
    throw Error('Task has not been found');
  }

  try {
    const circuitName = `${task.database}.${task.collection}`;
    const modelDbSetting = ModelDbSetting.getInstance(task.database);
    const { merkleHeight, appPublicKey } =
      (await modelDbSetting.getSetting()) || {};

    if (!merkleHeight || !appPublicKey) {
      throw new Error('Setting is wrong, unable to deconstruct settings');
    }

    const publicKey = PublicKey.fromBase58(appPublicKey);

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
    let proof = zkProof ? await RollUpProof.fromJSON(zkProof) : undefined;

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

    class ZkDbApp extends getZkDbSmartContract(task.database, merkleHeight) {}
    const zkDbApp = new ZkDbApp(publicKey);

    // TODO: Check if app exists

    const onChainRootState = zkDbApp.state.get();
    const onChainActionState = zkDbApp.actionState.get();

    assert(onChainRootState.equals(merkleRoot));

    const proofState = new ProofState({
      actionState: onChainActionState,
      rootState: onChainRootState,
    });

    const allActions = await zkDbApp.reducer.fetchActions({
      fromActionState: onChainActionState,
    });

    if (isEmptyArray(allActions) || isEmptyArray(allActions[0])) {
      throw new Error('Unformatted action data');
    }

    const [[action]] = allActions;

    assert(Field(task.hash).equals(action.hash));
    assert(UInt64.from(task.merkleIndex).equals(action.index));

    // TODO: Should we consider both on-chain action and off-chain leaf. Off-chain leaf = On-chain action
    proof = proof
      ? await circuit.update(proofState, proof, witness, oldLeaf, action)
      : await circuit.init(proofState, witness, oldLeaf, action);

    await modelProof.saveProof({
      ...proof.toJSON(),
      database: task.database,
      collection: task.collection,
    });
    await queue.markTaskProcessed(task.merkleIndex);

    logger.debug('Task processed successfully.');
  } catch (error) {
    logger.error('Error processing task:', error);
  }
}
