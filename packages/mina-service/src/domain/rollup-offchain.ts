import { deserializeTransition } from '@helper';
import { TRollUpOffChainRecord, TRollupQueueData } from '@zkdb/common';
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
  ): Promise<OptionalId<TRollUpOffChainRecord>> {
    const { serverless, proofService } = session;
    const { databaseName, transitionLogObjectId, operationNumber } = task;

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
      { databaseName },
      { sort: { createdAt: -1, step: -1 }, session: proofService }
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

    if (!previousProof) {
      // If previous proof not found and operationNumber must be 1, which mean first time create

      const merkleTree = new MerkleTree(merkleHeight);
      const firstRollup = deserializeTransition(rollupTransition);

      // Output step increase by 1 after init 0 - 1
      const firstRollupProof = await zkAppProcessor.init(
        merkleTree.getRoot(),
        merkleTree.getWitness(0n),
        firstRollup.leafNew
      );

      const { proof, merkleRootOld, step } =
        zkAppProcessor.serialize(firstRollupProof);

      if (step !== operationNumber) {
        throw new Error(
          `Output step and operationNumber did not match except ${operationNumber} but received ${step}`
        );
      }

      return {
        databaseName,
        merkleRootOld,
        proof,
        step,
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

    if (step !== operationNumber) {
      throw new Error(
        `Output step and operationNumber did not match except ${operationNumber} but received ${step}`
      );
    }

    return {
      databaseName,
      merkleRootOld,
      proof,
      transitionLogObjectId,
      step,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
