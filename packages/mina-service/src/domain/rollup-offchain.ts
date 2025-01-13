import { deserializeTransition } from '@helper';
import { EProofStatusDocument } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  getCurrentTime,
  ModelMetadataDatabase,
  ModelRollupOffChain,
  ModelTransitionLog,
  TCompoundSession,
  TRollupQueueData,
} from '@zkdb/storage';
import { MerkleTree } from 'o1js';

const MAX_MERKLE_TREE_HEIGHT = 256;
const MIN_MERKLE_TREE_HEIGHT = 8;

export class RollupOffchain {
  static async create(task: TRollupQueueData, session: TCompoundSession) {
    const { serverless, proofService } = session;
    const { status, databaseName } = task;
    // Ensure status must be 'queued' to process
    if (status !== EProofStatusDocument.Queued) {
      throw new Error(
        `Task status should be in ${EProofStatusDocument.Queued}`
      );
    }

    const imMetadataDatabase = ModelMetadataDatabase.getInstance();

    const metadataDatabase = await imMetadataDatabase.findOne(
      { databaseName },
      { session: serverless }
    );

    if (!metadataDatabase) {
      throw new Error(`Metadata database ${databaseName} cannot be found`);
    }

    const { merkleHeight } = metadataDatabase;

    if (
      merkleHeight < MIN_MERKLE_TREE_HEIGHT ||
      merkleHeight > MAX_MERKLE_TREE_HEIGHT
    ) {
      throw new Error(
        `Invalid Merkle height. Expected 8-256, got ${merkleHeight}`
      );
    }

    // ZkDbProcessor will automatically compile when getInstance
    const zkAppProcessor = await ZkDbProcessor.getInstance(merkleHeight);

    const imRollupOffChain = ModelRollupOffChain.getInstance();

    // Get previous proof to update
    const previousProof = await imRollupOffChain.findOne(
      { databaseName },
      { sort: { createdAt: -1 }, session: proofService }
    );

    const imTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
      proofService
    );

    const rollupTransition = await imTransitionLog.findOne({
      _id: task.transitionLogObjectId,
    });

    if (!rollupTransition) {
      throw new Error(
        `Cannot found rollup transaction for database ${databaseName}`
      );
    }

    // If previous proof not found, which mean first time create
    if (!previousProof) {
      const merkleTree = new MerkleTree(merkleHeight);
      const firstRollupProof = await zkAppProcessor.init(
        merkleTree.getRoot(),
        merkleTree.getWitness(0n)
      );

      const newRollupProof = await zkAppProcessor.update(
        firstRollupProof,
        deserializeTransition(rollupTransition)
      );

      const { proof, merkleRootOld, step } =
        zkAppProcessor.serialize(newRollupProof);
      await imRollupOffChain.insertOne(
        {
          databaseName,
          merkleRootOld: merkleRootOld,
          proof,
          step: BigInt(step),
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
          transitionLogObjectId: task.transitionLogObjectId,
        },
        {
          session: proofService,
        }
      );
      return;
    }

    const previousProofFormat = await zkAppProcessor.deserialize(
      JSON.stringify(previousProof)
    );

    const newRollupProof = await zkAppProcessor.update(
      previousProofFormat,
      deserializeTransition(rollupTransition)
    );

    const { proof, merkleRootOld, step } =
      zkAppProcessor.serialize(newRollupProof);

    await imRollupOffChain.insertOne(
      {
        databaseName,
        merkleRootOld,
        proof,
        step: BigInt(step),
        transitionLogObjectId: task.transitionLogObjectId,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      {
        session: proofService,
      }
    );
  }
}
