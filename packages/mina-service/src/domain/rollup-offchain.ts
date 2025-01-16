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

      const {
        proof,
        merkleRootOld,
        step: outputStep,
      } = zkAppProcessor.serialize(firstRollupProof);
      // After init, output step must be 1n and equals to operationNumber 1n, throw Error if not
      if (outputStep !== operationNumber) {
        throw new Error(
          `Output first step and operationNumber did not match. Except ${operationNumber} but received ${outputStep}`
        );
      }

      return {
        databaseName,
        merkleRootOld,
        proof,
        step: outputStep,
        createdAt: new Date(),
        updatedAt: new Date(),
        transitionLogObjectId,
      };
    }
    // Previous output step + 1n = operationNumber, if not throw Error
    if (previousProof.step + 1n !== operationNumber) {
      throw new Error(
        `Previous output step and operationNumber did not match. Except ${operationNumber} but received ${previousProof.step}`
      );
    }

    const previousProofFormat = await zkAppProcessor.deserialize(previousProof);

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
      step,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
