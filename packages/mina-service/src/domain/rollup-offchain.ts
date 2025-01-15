import { deserializeTransition } from '@helper';
import { TRollupOffChainRecord, TRollupQueueData } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  ModelMetadataDatabase,
  ModelRollupOffChain,
  ModelTransitionLog,
  TCompoundSession,
} from '@zkdb/storage';
import { OptionalId } from 'mongodb';
import { MerkleTree } from 'o1js';

const MAX_MERKLE_TREE_HEIGHT = 256;
const MIN_MERKLE_TREE_HEIGHT = 8;

export class RollupOffChain {
  static async create(
    task: TRollupQueueData,
    session: TCompoundSession
  ): Promise<OptionalId<TRollupOffChainRecord>> {
    const { serverless, proofService } = session;
    const { databaseName, transitionLogObjectId } = task;

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
    // NOTE: It must be sequential and can't be access with another queue task in the same database
    const previousProof = await imRollupOffChain.findOne(
      { databaseName, step: BigInt(task.operationNumber) - 1n },
      { sort: { createdAt: -1 }, session: proofService }
    );

    const imTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
      proofService
    );

    const rollupTransition = await imTransitionLog.findOne({
      _id: transitionLogObjectId,
    });

    if (!rollupTransition) {
      throw new Error(
        `Cannot found rollup transaction for database ${databaseName}`
      );
    }

    // If previous proof not found and operationNumber must be 1, which mean first time create
    if (!previousProof && task.operationNumber === 1) {
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

      return {
        databaseName,
        merkleRootOld: merkleRootOld,
        proof,
        step: BigInt(step),
        createdAt: new Date(),
        updatedAt: new Date(),
        transitionLogObjectId,
      };
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

    return {
      databaseName,
      merkleRootOld,
      proof,
      transitionLogObjectId,
      step: BigInt(step),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
