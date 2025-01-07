import {
  ZkDatabaseContractFactory,
  ZkDatabaseStateInput,
  ZkDatabaseStateOutput,
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
  static async create(
    {
      databaseName,
      collectionName,
      createdAt,
      merkleIndex,
      status,
      hash,
      _id,
    }: TQueueRecord,
    session: TCompoundSession
  ) {
    if (status !== EProofStatusDocument.Queued) {
      throw Error('Task status is not Queued');
    }
    // Model initialize
    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);
    const imProof = ModelProof.getInstance();
    const imMetadataDatabase = ModelMetadataDatabase.getInstance();
    // Get appPublicKey to check on-chain/off-chain, merkleHeight for calculate
    const { merkleHeight, appPublicKey } =
      (await imMetadataDatabase.findOne(
        {
          databaseName,
        },
        { session: session.serverless }
      )) || {};
    // Ensure valid merkle Height
    if (!merkleHeight) {
      throw new Error(
        `Merkle height metadata for database ${databaseName} is not found`
      );
    }

    const circuitName = `${databaseName}.${collectionName}`;
    // Check Circuit existed
    if (!CircuitFactory.contains(circuitName)) {
      // Create & compile Circuit if does not have
      await CircuitFactory.createCircuit(circuitName, merkleHeight);
    }

    const circuit = CircuitFactory.getCircuit(circuitName).getProgram();
    class RollupProof extends ZkProgram.Proof(circuit) {}
    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    const zkProof = await imProof.findOne(
      { databaseName },
      { sort: { createdAt: -1 }, session: session.proofService }
    );

    let proof = zkProof ? await RollupProof.fromJSON(zkProof) : undefined;

    const rollupProof = await RollUpProof.fromJSON(zkProof);

    const witness = new DatabaseMerkleWitness(
      await imMerkleTree.getMerkleProof(
        merkleIndex,
        new Date(createdAt.getTime() - 1),
        { session: session.serverless }
      )
    );

    const merkleRoot = await imMerkleTree.getRoot(
      new Date(createdAt.getTime() - 1),
      { session: session.serverless }
    );

    const oldLeaf = await imMerkleTree.getNode(
      0,
      merkleIndex,
      new Date(createdAt.getTime() - 1),
      { session: session.serverless }
    );

    // Default values
    let onChainRootState = new MerkleTree(merkleHeight).getRoot();
    let prevOnChainRootState = Field(0);

    if (appPublicKey) {
      const publicKey = PublicKey.fromBase58(appPublicKey);
      const res = await fetchAccount({ publicKey });
      const accountExists = res.error == null;
      if (accountExists) {
        class ZkDbApp extends ZkDatabaseContractFactory(
          merkleHeight,
          circuit
        ) {}
        const zkDbApp = new ZkDbApp(publicKey);

        onChainRootState = zkDbApp.currentState.get();
        prevOnChainRootState = zkDbApp.prevState.get();
      }
    }

    if (proof) {
      const prevProofOutput = proof.publicOutput as ZkDatabaseStateOutput;

      const proofState = new ZkDatabaseStateInput({
        onChainStateCurrent: onChainRootState,
        onChainStatePervious: prevOnChainRootState,
        offChainStateCurrent: merkleRoot,
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
            await RollupProof.fromJSON(rollupProof),
            proof,
            witness,
            oldLeaf,
            Field(hash)
          );
        } else {
          throw Error('Rollup Proof has not been found');
        }
      }
    } else {
      const proofState = new ZkDatabaseStateInput({
        onChainStatePervious: Field(0),
        onChainStateCurrent: onChainRootState,
        offChainStateCurrent: merkleRoot,
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

    logger.debug(`Task with ID ${_id} processed successfully`);
  }
}
