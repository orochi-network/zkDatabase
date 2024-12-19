import {
  getZkDbSmartContractClass,
  ProofStateInput,
  ProofStateOutput,
} from '@zkdb/smart-contract';
import {
  ModelMerkleTree,
  ModelMetadataDatabase,
  ModelProof,
  ModelQueueTask,
  withTransaction,
} from '@zkdb/storage';
import { ObjectId } from 'mongodb';
import { EProofStatusDocument } from '@zkdb/common';
import {
  fetchAccount,
  Field,
  MerkleTree,
  MerkleWitness,
  PublicKey,
  ZkProgram,
} from 'o1js';
import { CircuitFactory } from '@circuit';
import { logger } from '@helper';

// @TODO Think about apply session in this code
export async function createProof(taskId: string) {
  const imQueue = ModelQueueTask.getInstance();

  const task = await imQueue.findOne({ _id: new ObjectId(taskId) });

  if (!task) {
    logger.error('Task has not been found');
    throw Error('Task has not been found');
  }

  if (task.status !== EProofStatusDocument.Proving) {
    logger.error('Task has not been marked as executing');
    throw Error('Task has not been marked as executing');
  }

  const { databaseName, collectionName, createdAt, merkleIndex, hash, _id } =
    task;
  try {
    const circuitName = `${databaseName}.${collectionName}`;
    const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();
    const { merkleHeight, appPublicKey } =
      (await modelDatabaseMetadata.findOne({
        databaseName,
      })) || {};

    if (!merkleHeight) {
      throw new Error(
        `Something wrong, merkle height for ${databaseName} database has not been found`
      );
    }

    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    if (!CircuitFactory.contains(circuitName)) {
      await CircuitFactory.createCircuit(circuitName, merkleHeight);
    }

    const circuit = await CircuitFactory.getCircuit(circuitName).getProgram();
    class RollUpProof extends ZkProgram.Proof(circuit) {}
    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    const imProof = ModelProof.getInstance();
    const zkProof = await imProof.findOne(
      { databaseName },
      { sort: { createdAt: -1 } }
    );
    let proof = zkProof ? await RollUpProof.fromJSON(zkProof) : undefined;

    const witness = new DatabaseMerkleWitness(
      await imMerkleTree.getMerkleProof(
        merkleIndex,
        new Date(createdAt.getTime() - 1)
      )
    );
    const merkleRoot = await imMerkleTree.getRoot(
      new Date(createdAt.getTime() - 1)
    );
    const oldLeaf = await imMerkleTree.getNode(
      0,
      merkleIndex,
      new Date(createdAt.getTime() - 1)
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
          Field(hash)
        );
      } else {
        const rollupProof = await imProof.findOne({
          merkleRoot: onChainRootState.toString(),
          databaseName,
        });
        if (rollupProof) {
          proof = await circuit.updateTransition(
            proofState,
            await RollUpProof.fromJSON(rollupProof),
            proof,
            witness,
            oldLeaf,
            Field(hash)
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
      proof = await circuit.init(proofState, witness, oldLeaf, Field(hash));
    }

    // TODO: Should we consider both on-chain action and off-chain leaf. Off-chain leaf = On-chain action

    await withTransaction(async (session) => {
      const date = new Date();
      await imProof.insertOne(
        {
          ...proof.toJSON(),
          databaseName,
          collectionName,
          merkleRootPrevious: onChainRootState.toString(),
          // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
          merkleRoot: proof.publicOutput.newOffChainState.toString(),
          createdAt: date,
          updatedAt: date,
        },
        { session }
      );
      await imQueue.markTaskProcessed(_id, { session });
    }, 'proofService');

    logger.debug('Task processed successfully.');
  } catch (error) {
    await imQueue.markTaskAsError(_id, error as string);
    logger.error('Error processing task:', error);
  }
}
