import { EProofStatusDocument, TQueueRecord } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  getCurrentTime,
  ModelMetadataDatabase,
  ModelRollupOffChain,
  TCompoundSession,
} from '@zkdb/storage';
import { Field, MerkleTree } from 'o1js';

const MAX_MERKLE_TREE_HEIGHT = 256;
const MIN_MERKLE_TREE_HEIGHT = 8;

export class RollupOffchain {
  static async create(task: TQueueRecord, session: TCompoundSession) {
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

    const previousProof = await imRollupOffChain.findOne(
      { databaseName },
      { sort: { createdAt: -1 }, session: proofService }
    );

    // If previous proof not found, which mean first time create
    if (!previousProof) {
      const merkleTree = new MerkleTree(merkleHeight);
      const firstRollupProof = await zkAppProcessor.init(
        merkleTree.getRoot(),
        merkleTree.getWitness(0n)
      );

      const newRollupProof = await zkAppProcessor.update(
        firstRollupProof,
        // TODO: Since queue not implement I'll assume that we have rollup transaction
        // @ts-expect-error
        task.rollupTransition
      );

      const { proof, merkleRootOld, step } =
        zkAppProcessor.serialize(newRollupProof);

      await imRollupOffChain.insertOne(
        {
          databaseName,
          // TODO: Since queue not implement I'll assume that we have
          // @ts-expect-error
          merkleRootNew: task.merkleRootNew,
          merkleRootOld: merkleRootOld,
          proof,
          step: BigInt(step),
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
          merkleProof: [],
          leafOld: Field(0).toString(),
          // TODO: Since queue not implement I'll assume that we have
          // @ts-expect-error
          leafNew: task.leafNew,
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

    const newRollupProof = await zkAppProcessor.update(previousProofFormat, {
      // TODO: Since queue not implement I'll assume that we have
      // @ts-expect-error: Since we don't have rollup transition yet
      merkleProof: task.merkleProof,
      // TODO: Since queue not implement I'll assume that we have
      // @ts-expect-error: Since we don't have rollup transition yet
      merkleRootNew: Field(task.merkleRootNew),
      // TODO: Since queue not implement I'll assume that we have
      // @ts-expect-error: Since we don't have rollup transition yet
      leafOld: Field(task.leafOld),
      // TODO: Since queue not implement I'll assume that we have
      // @ts-expect-error: Since we don't have rollup transition yet
      leafNew: Field(task.leafNew),
    });

    const { proof, merkleRootOld, step } =
      zkAppProcessor.serialize(newRollupProof);

    await imRollupOffChain.insertOne(
      {
        databaseName,
        // TODO: Since queue not implement I'll assume that we have
        // @ts-expect-error
        merkleRootNew: task.merkleRootNew,
        merkleRootOld,
        proof,
        step: BigInt(step),
        // TODO: Since queue not implement I'll assume that we have
        // @ts-expect-error
        merkleProof: task.merkleProof,
        // TODO: Since queue not implement I'll assume that we have
        // @ts-expect-error
        leafOld: task.leafOld,
        // TODO: Since queue not implement I'll assume that we have
        // @ts-expect-error
        leafNew: task.leafNew,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      {
        session: proofService,
      }
    );
  }
}
