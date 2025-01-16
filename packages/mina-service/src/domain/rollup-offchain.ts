import { deserializeTransition } from '@helper';
import {
  TRollUpOffChainRecord,
  TRollupQueueData,
  TTransitionLogRecord,
} from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  ModelMetadataDatabase,
  ModelRollupOffChain,
  ModelTransitionLog,
  TCompoundSession,
} from '@zkdb/storage';
import { OptionalId } from 'mongodb';

const MAX_MERKLE_TREE_HEIGHT = 256;
const MIN_MERKLE_TREE_HEIGHT = 8;

type TRollupInitParam = {
  task: TRollupQueueData;
  merkleHeight: number;
  transitionLog: TTransitionLogRecord;
};

type TRollupUpdateParam = TRollupInitParam & {
  previousZkProof: TRollUpOffChainRecord;
};

export class RollupOffChain {
  public static async rollup(
    task: TRollupQueueData,
    session: TCompoundSession
  ): Promise<OptionalId<TRollUpOffChainRecord>> {
    const { serverless, proofService } = session;

    const imMetadataDatabase = ModelMetadataDatabase.getInstance();

    const metadataDatabase = await imMetadataDatabase.findOne(
      { databaseName: task.databaseName },
      { session: serverless }
    );

    if (!metadataDatabase) {
      throw new Error(`Metadata database ${task.databaseName} cannot be found`);
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

    const imTransitionLog = await ModelTransitionLog.getInstance(
      task.databaseName,
      proofService
    );

    const transitionLog = await imTransitionLog.findOne({
      _id: task.transitionLogObjectId,
    });

    if (!transitionLog) {
      throw new Error(
        `Cannot found rollup transaction for database ${task.databaseName}`
      );
    }

    const imRollupOffChain = ModelRollupOffChain.getInstance();

    // Get previous proof to update
    // NOTE: It must be sequential and can't be access with another queue task in the same database
    const previousZkProof = await imRollupOffChain.findOne(
      { databaseName: task.databaseName },
      { sort: { step: -1 }, session: proofService }
    );

    if (!previousZkProof) {
      // If previous proof not found and operationNumber must be 1, which mean first time create
      const zkProof = await RollupOffChain.init({
        task,
        merkleHeight,
        transitionLog,
      });

      return zkProof;
    }

    const zkProof = await RollupOffChain.update({
      task,
      merkleHeight,
      transitionLog,
      previousZkProof,
    });

    return zkProof;
  }

  private static async init(
    param: TRollupInitParam
  ): Promise<OptionalId<TRollUpOffChainRecord>> {
    const { task, merkleHeight, transitionLog } = param;
    // ZkDbProcessor will automatically compile when getInstance
    const zkAppProcessor = await ZkDbProcessor.getInstance(merkleHeight);

    const transitionDeserialized = deserializeTransition(transitionLog);

    const zkProof = await zkAppProcessor.init(
      transitionDeserialized.merkleRootNew,
      transitionDeserialized.merkleProof,
      transitionDeserialized.leafNew
    );

    // Serialized after init
    const serializedZkProof = zkAppProcessor.serialize(zkProof);
    // After init, output step must be 1n and equals to operationNumber 1n, throw Error if not
    if (serializedZkProof.step !== task.operationNumber) {
      throw new Error(
        `Output first step and operationNumber did not match. Except ${task.operationNumber} but received ${serializedZkProof.step}`
      );
    }

    return {
      databaseName: task.databaseName,
      transitionLogObjectId: transitionLog._id,
      merkleRootOld: serializedZkProof.merkleRootOld,
      proof: serializedZkProof.proof,
      step: serializedZkProof.step,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private static async update(
    param: TRollupUpdateParam
  ): Promise<OptionalId<TRollUpOffChainRecord>> {
    const { task, previousZkProof, merkleHeight, transitionLog } = param;

    // Previous output step + 1n = operationNumber, if not throw Error
    if (previousZkProof.step + 1n !== task.operationNumber) {
      throw new Error(
        `Previous output step and operationNumber did not match. Except ${task.operationNumber} but received ${previousZkProof.step}`
      );
    }
    // ZkDbProcessor will automatically compile when getInstance
    const zkAppProcessor = await ZkDbProcessor.getInstance(merkleHeight);

    const transitionDeserialized = deserializeTransition(transitionLog);

    const previousProofFormat =
      await zkAppProcessor.deserialize(previousZkProof);

    const zkProof = await zkAppProcessor.update(
      previousProofFormat,
      transitionDeserialized
    );

    const zkProofSerialized = zkAppProcessor.serialize(zkProof);

    return {
      databaseName: task.databaseName,
      transitionLogObjectId: transitionLog._id,
      merkleRootOld: zkProofSerialized.merkleRootOld,
      proof: zkProofSerialized.proof,
      step: zkProofSerialized.step,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
