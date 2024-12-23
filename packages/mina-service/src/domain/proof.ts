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
  TCompoundSession,
} from '@zkdb/storage';
import { EProofStatusDocument, TQueueRecord } from '@zkdb/common';
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

export class Proof {
  static async getNextTask(
    session: TCompoundSession
  ): Promise<TQueueRecord | null> {
    const modelQueueTask = ModelQueueTask.getInstance();
    const task = await modelQueueTask.getLatestQueuedTaskByDatabase(
      session.proofService
    );

    return task;
  }

  static async create(task: TQueueRecord, session: TCompoundSession) {
    if (task.status !== EProofStatusDocument.Queued) {
      throw Error('Task status is not Queued');
    }

    const { databaseName, collectionName, createdAt, merkleIndex, hash, _id } =
      task;

    const imQueue = ModelQueueTask.getInstance();
    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);
    const imProof = ModelProof.getInstance();

    // NOTE: that this may not be visible to other transactions until the
    // session is committed
    await imQueue.updateOne(
      {
        _id,
      },
      {
        $set: {
          status: EProofStatusDocument.Proving,
        },
      },
      { session: session.proofService }
    );

    try {
      const circuitName = `${databaseName}.${collectionName}`;
      const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();
      const { merkleHeight, appPublicKey } =
        (await modelDatabaseMetadata.findOne(
          {
            databaseName,
          },
          { session: session.serverless }
        )) || {};

      if (!merkleHeight) {
        throw new Error(
          `Merkle height metadata for database ${databaseName} is not found`
        );
      }

      if (!CircuitFactory.contains(circuitName)) {
        await CircuitFactory.createCircuit(circuitName, merkleHeight);
      }

      const circuit = CircuitFactory.getCircuit(circuitName).getProgram();
      class RollUpProof extends ZkProgram.Proof(circuit) {}
      class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

      const zkProof = await imProof.findOne(
        { databaseName },
        { sort: { createdAt: -1 }, session: session.proofService }
      );
      let proof = zkProof ? await RollUpProof.fromJSON(zkProof) : undefined;

      const witness = new DatabaseMerkleWitness(
        await imMerkleTree.getMerkleProof(
          merkleIndex,
          new Date(createdAt.getTime() - 1),
          { session: session.proofService }
        )
      );
      const merkleRoot = await imMerkleTree.getRoot(
        new Date(createdAt.getTime() - 1),
        { session: session.proofService }
      );
      const oldLeaf = await imMerkleTree.getNode(
        0,
        merkleIndex,
        new Date(createdAt.getTime() - 1),
        { session: session.proofService }
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
          const rollupProof = await imProof.findOne(
            {
              merkleRoot: onChainRootState.toString(),
              databaseName,
            },
            { session: session.proofService }
          );
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
        { session: session.proofService }
      );

      await imQueue.markTaskProcessed(_id, { session: session.proofService });

      logger.debug(`Task with ID ${_id} processed successfully`);
    } catch (error) {
      let errorMessage;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error: ' + String(error);
      }

      await imQueue.markTaskAsError(_id, errorMessage, {
        session: session.proofService,
      });

      logger.error(`Error processing task with ID ${_id}:`, error);
    }
  }
}
