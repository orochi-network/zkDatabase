import { CircuitFactory } from '@circuit';
import { logger } from '@helper';
import { EProofStatusDocument, TQueueRecord } from '@zkdb/common';
import {
  getZkDbSmartContractClass,
  ProofStateInput,
  ProofStateOutput,
} from '@zkdb/smart-contract';
import {
  getCurrentTime,
  ModelMerkleTree,
  ModelMetadataDatabase,
  ModelProof,
  TCompoundSession,
} from '@zkdb/storage';
import { fetchAccount, Field, MerkleWitness, PublicKey, ZkProgram } from 'o1js';
import { Witness } from 'o1js/dist/node/lib/provable/merkle-tree';

class Proof {
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
    // Ensure status must be 'queued' to process
    if (status !== EProofStatusDocument.Queued) {
      throw new Error(
        `Task status should be in ${EProofStatusDocument.Queued}`
      );
    }
    // Initialize metadata database model to get merkle height and appPublicKey
    // to detect on-chain/off-chain proof
    const imMetadataDatabase = ModelMetadataDatabase.getInstance();

    const metadataDatabase = await imMetadataDatabase.findOne({ databaseName });

    if (!metadataDatabase) {
      throw new Error(`Metadata database ${databaseName} cannot be found`);
    }

    const { merkleHeight, appPublicKey } = metadataDatabase;

    if (merkleHeight < 8 || merkleHeight > 256) {
      throw new Error(
        `Invalid Merkle height. Expected 8-256, got ${merkleHeight}`
      );
    }

    // On-chain proof
    if (appPublicKey) {
      await Proof2.createOnChainProof({
        appPublicKey,
        databaseName,
        collectionName,
        merkleHeight,
        merkleIndex,
        hash,
      });
    }
  }

  /**/
  private static async createOnChainProof({
    appPublicKey,
    databaseName,
    collectionName,
    merkleHeight,
    merkleIndex,
    hash,
  }: {
    appPublicKey: string;
    databaseName: string;
    collectionName: string;
    merkleHeight: number;
    merkleIndex: bigint;
    hash: string;
  }) {
    // Convert base58 string to PublicKey o1js type
    const databasePublicKey = PublicKey.fromBase58(appPublicKey);

    const { account, error } = await fetchAccount({
      publicKey: databasePublicKey,
    });

    // Ensure account existed and don't have any error
    if (!account || error) {
      // Right now `fetchAccount` from o1js doesn't return a flag
      // to recognize it a `zkApp` address or normal address

      // It can be a case that error is undefined,
      // it still be an error exception and escape the function
      // But we also need log.error to prevent it undefined and we can't get the log
      logger.error(
        `This zkApp publicKey ${appPublicKey} cannot be found in Mina blockchain`
      );

      throw error;
    }

    const circuitName = `${databaseName}.${collectionName}`;
    // Check Circuit existed
    if (!CircuitFactory.contains(circuitName)) {
      // Create & compile Circuit if does not have
      await CircuitFactory.createCircuit(circuitName, merkleHeight);
    }

    const circuitProgram = CircuitFactory.getCircuit(circuitName).getProgram();

    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    class ZkDbApp extends getZkDbSmartContractClass(
      merkleHeight,
      circuitProgram
    ) {}
    const zkDbApp = new ZkDbApp(databasePublicKey);

    const onChainRootState: Field = zkDbApp.currentState.get();
    const prevOnChainRootState: Field = zkDbApp.prevState.get();

    const imProof = ModelProof.getInstance();
    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    // TODO: right now we assumed that this is the get current merkle root method at the createdAt,
    // Since we need to finish refactor MerkleTree first
    // Current here is current at that time(createdAt) that the task queue provide
    const currentMerkleRoot = await imMerkleTree.getRoot(new Date());
    const currentMerkleLeaf = await imMerkleTree.getNode(
      0,
      merkleIndex,
      new Date()
    );
    const currentMerkleProof = await imMerkleTree.getMerkleProof(
      merkleIndex,
      new Date()
    );

    const currentMerkleWitness = new DatabaseMerkleWitness(currentMerkleProof);
    // Get latest proof in database, not on chain
    const currentProof = await imProof.findOne(
      { databaseName },
      { sort: { createdAt: -1 } }
    );

    // Latest proof in database found
    if (currentProof) {
      class ZkProofProgram extends ZkProgram.Proof(circuitProgram) {}

      // Format the proof
      const currentProofFormat = await ZkProofProgram.fromJSON(currentProof);

      const currentProofOutput: ProofStateOutput =
        currentProofFormat.publicOutput;

      const proofState = new ProofStateInput({
        currentOnChainState: onChainRootState,
        previousOnChainState: prevOnChainRootState,
        currentOffChainState: currentMerkleRoot,
      });

      // Ensure that current proof output onChainState need to equals with zkDbApp.currentState.get()
      if (
        currentProofOutput.onChainState.equals(onChainRootState).toBoolean()
      ) {
        const newProof = await circuitProgram.update(
          proofState,
          currentProofFormat,
          currentMerkleWitness,
          currentMerkleLeaf,
          Field(hash)
        );

        await imProof.insertOne({
          ...newProof.toJSON(),
          databaseName,
          collectionName,
          merkleRootPrevious: onChainRootState.toString(),
          // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
          merkleRoot: newProof.publicOutput.newOffChainState.toString(),
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
        });
      } else {
        // It's a rollup proof
        const rollupProof = await imProof.findOne(
          {
            merkleRoot: onChainRootState.toString(),
            databaseName,
          },
          { sort: { createdAt: -1 } }
        );

        if (!rollupProof) {
          throw Error(
            `Cannot found rollup proof: ${onChainRootState.toString()} in database: ${databaseName}`
          );
        }

        const newRollupProof = await circuitProgram.updateTransition(
          proofState,
          await ZkProofProgram.fromJSON(rollupProof),
          currentProofFormat,
          currentMerkleWitness,
          currentMerkleLeaf,
          Field(hash)
        );

        await imProof.insertOne({
          ...newRollupProof.toJSON(),
          databaseName,
          collectionName,
          merkleRootPrevious: onChainRootState.toString(),
          // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
          merkleRoot: newRollupProof.publicOutput.newOffChainState.toString(),
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
        });
      }
    } else {
      // Don't have any latest proof in database, which mean this is first time create proof
      const proofState = new ProofStateInput({
        previousOnChainState: Field(0),
        currentOnChainState: onChainRootState,
        currentOffChainState: currentMerkleRoot,
      });

      const initProof = await circuitProgram.init(
        proofState,
        currentMerkleWitness,
        currentMerkleLeaf,
        Field(hash)
      );

      await imProof.insertOne({
        ...initProof.toJSON(),
        databaseName,
        collectionName,
        merkleRootPrevious: onChainRootState.toString(),
        // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
        merkleRoot: initProof.publicOutput.newOffChainState.toString(),
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      });
    }
  }

  private static async createOffChainProof({
    databaseName,
    collectionName,
    merkleHeight,
    merkleIndex,
    hash,
  }: {
    databaseName: string;
    collectionName: string;
    merkleHeight: number;
    merkleIndex: bigint;
    hash: string;
  }) {
    const circuitName = `${databaseName}.${collectionName}`;
    // Check Circuit existed
    if (!CircuitFactory.contains(circuitName)) {
      // Create & compile Circuit if does not have
      await CircuitFactory.createCircuit(circuitName, merkleHeight);
    }

    const circuitProgram = CircuitFactory.getCircuit(circuitName).getProgram();
    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    const imProof = ModelProof.getInstance();
    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    // TODO: right now we assumed that this is the get previous merkle root method at the createdAt,
    const previousMerkleRoot: Field =
      // @ts-expect-error Right now we don't have getPreviousMerkleRoot() just assume we got the previous merkle root
      await imMerkleTree.getPreviousMerkleRoot();

    // TODO: right now we assumed that this is the get current merkle root method at the createdAt,
    // Since we need to finish refactor MerkleTree first
    // Current here is current at that time(createdAt) that the task queue provide
    const currentMerkleRoot: Field = await imMerkleTree.getRoot(new Date());
    const currentMerkleLeaf: Field = await imMerkleTree.getNode(
      0,
      merkleIndex,
      new Date()
    );

    const currentMerkleProof: Witness = await imMerkleTree.getMerkleProof(
      merkleIndex,
      new Date()
    );

    const currentMerkleWitness = new DatabaseMerkleWitness(currentMerkleProof);
    // Get latest proof in database, not on chain
    const currentProof = await imProof.findOne(
      { databaseName },
      { sort: { createdAt: -1 } }
    );

    // Latest proof in database found
    if (currentProof) {
      class ZkProofProgram extends ZkProgram.Proof(circuitProgram) {}
      circuitProgram.
      // Format the proof
      const currentProofFormat = await ZkProofProgram.fromJSON(currentProof);

      const currentProofOutput: ProofStateOutput =
        currentProofFormat.publicOutput;

      // const proofState = new ProofStateInput({
      //   currentOnChainState: onChainRootState,
      //   previousOnChainState: prevOnChainRootState,
      //   currentOffChainState: currentMerkleRoot,
      // });

      // Ensure that current proof output onChainState need to equals with zkDbApp.currentState.get()
      if (
        currentProofOutput.newOffChainState.equals(onChainRootState).toBoolean()
      ) {
        const newProof = await circuitProgram.update(
          proofState,
          currentProofFormat,
          currentMerkleWitness,
          currentMerkleLeaf,
          Field(hash)
        );

        await imProof.insertOne({
          ...newProof.toJSON(),
          databaseName,
          collectionName,
          merkleRootPrevious: onChainRootState.toString(),
          // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
          merkleRoot: newProof.publicOutput.newOffChainState.toString(),
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
        });
      } else {
        // It's a rollup proof
        const rollupProof = await imProof.findOne(
          {
            merkleRoot: onChainRootState.toString(),
            databaseName,
          },
          { sort: { createdAt: -1 } }
        );

        if (!rollupProof) {
          throw Error(
            `Cannot found rollup proof: ${onChainRootState.toString()} in database: ${databaseName}`
          );
        }

        const newRollupProof = await circuitProgram.updateTransition(
          proofState,
          await ZkProofProgram.fromJSON(rollupProof),
          currentProofFormat,
          currentMerkleWitness,
          currentMerkleLeaf,
          Field(hash)
        );

        await imProof.insertOne({
          ...newRollupProof.toJSON(),
          databaseName,
          collectionName,
          merkleRootPrevious: onChainRootState.toString(),
          // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
          merkleRoot: newRollupProof.publicOutput.newOffChainState.toString(),
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
        });
      }
    } else {
      // Don't have any latest proof in database, which mean this is first time create proof
      const proofState = new ProofStateInput({
        previousOnChainState: Field(0),
        currentOnChainState: onChainRootState,
        currentOffChainState: currentMerkleRoot,
      });

      const initProof = await circuitProgram.init(
        proofState,
        currentMerkleWitness,
        currentMerkleLeaf,
        Field(hash)
      );

      await imProof.insertOne({
        ...initProof.toJSON(),
        databaseName,
        collectionName,
        merkleRootPrevious: onChainRootState.toString(),
        // TODO: We should check newOffChainState exist or not, because publicOutput is `any`
        merkleRoot: initProof.publicOutput.newOffChainState.toString(),
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      });
    }
  }
}
