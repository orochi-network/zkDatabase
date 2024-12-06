import {
  getZkDbSmartContractClass,
  ProofStateInput,
  ProofStateOutput,
} from '@zkdb/smart-contract';
import {
  ModelDatabase,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
  withTransaction,
} from '@zkdb/storage';
import { ObjectId } from 'mongodb';
import {
  fetchAccount,
  Field,
  MerkleTree,
  MerkleWitness,
  PublicKey,
  ZkProgram,
} from 'o1js';
import CircuitFactory from '../circuit/circuit-factory.js';
import logger from '../helper/logger.js';

export async function createProof(taskId: string) {
  const queue = ModelQueueTask.getInstance();

  const task = await queue.findOne({ _id: new ObjectId(taskId) });

  if (!task) {
    logger.error('Task has not been found');
    throw Error('Task has not been found');
  }

  if (task.status !== 'proving') {
    logger.error('Task has not been marked as executing');
    throw Error('Task has not been marked as executing');
  }

  try {
    const circuitName = `${task.database}.${task.collection}`;
    const modelDatabase = ModelDatabase.getInstance();
    const { merkleHeight, appPublicKey } =
      (await modelDatabase.getDatabase(task.database)) || {};

    if (!merkleHeight) {
      throw new Error(
        `Something wrong, merkle height for ${task.database} database has not been found`
      );
    }

    const merkleTree = await ModelMerkleTree.load(task.database);

    if (!CircuitFactory.contains(circuitName)) {
      await CircuitFactory.createCircuit(circuitName, merkleHeight);
    }

    const circuit = await CircuitFactory.getCircuit(circuitName).getProgram();
    class RollUpProof extends ZkProgram.Proof(circuit) {}
    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    const modelProof = ModelProof.getInstance();
    const zkProof = await modelProof.getProof(task.database);
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

    // Default values
    let onChainRootState = new MerkleTree(merkleHeight).getRoot();
    let prevOnChainRootState = Field(0);

    if (appPublicKey) {
      const publicKey = PublicKey.fromBase58(appPublicKey);
      const res = await fetchAccount({ publicKey });
      const accountExists = res.error == null;
      if (accountExists) {
        class ZkDbApp extends getZkDbSmartContractClass(
          merkleHeight,
          circuit
        ) {}
        const zkDbApp = new ZkDbApp(publicKey);

        onChainRootState = zkDbApp.currentState.get();
        prevOnChainRootState = zkDbApp.prevState.get();
      }
    }

    if (proof) {
      const prevProofOutput = proof.publicOutput as ProofStateOutput;

      const proofState = new ProofStateInput({
        currentOnChainState: onChainRootState,
        previousOnChainState: prevOnChainRootState,
        currentOffChainState: merkleRoot,
      });

      if (prevProofOutput.onChainState.equals(onChainRootState).toBoolean()) {
        // basic
        proof = await circuit.update(
          proofState,
          proof,
          witness,
          oldLeaf,
          Field(task.hash)
        );
      } else {
        const rollupProof = await modelProof.findOne({
          merkleRoot: onChainRootState.toString(),
          database: task.database,
        });
        if (rollupProof) {
          proof = await circuit.updateTransition(
            proofState,
            await RollUpProof.fromJSON(rollupProof),
            proof,
            witness,
            oldLeaf,
            Field(task.hash)
          );
        } else {
          throw Error('RollUp Proof has not been found');
        }
      }
    } else {
      const proofState = new ProofStateInput({
        previousOnChainState: Field(0),
        currentOnChainState: onChainRootState,
        currentOffChainState: merkleRoot,
      });
      proof = await circuit.init(
        proofState,
        witness,
        oldLeaf,
        Field(task.hash)
      );
    }

    // TODO: Should we consider both on-chain action and off-chain leaf. Off-chain leaf = On-chain action

    await withTransaction(async (session) => {
      await modelProof.saveProof(
        {
          ...proof.toJSON(),
          database: task.database,
          collection: task.collection,
          prevMerkleRoot: onChainRootState.toString(),
          merkleRoot: proof.publicOutput.newOffChainState.toString(),
        },
        { session }
      );
      await queue.markTaskProcessed(task._id, { session });
    }, 'proof');

    logger.debug('Task processed successfully.');
  } catch (error) {
    await queue.markTaskAsError(task._id, error as string);
    logger.error('Error processing task:', error);
  }
}
