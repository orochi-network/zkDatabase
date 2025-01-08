import { EProofStatusDocument, TQueueRecord } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  ModelMetadataDatabase,
  ModelProof,
  TCompoundSession,
} from '@zkdb/storage';
import { MerkleTree } from 'o1js';

const MAX_MERKLE_TREE_HEIGHT = 256;
const MIN_MERKLE_TREE_HEIGHT = 8;

export class RollupOffchain {
  static async create(task: TQueueRecord, session: TCompoundSession) {
    const { status, databaseName } = task;
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

    const { merkleHeight } = metadataDatabase;

    if (merkleHeight < MIN_MERKLE_TREE_HEIGHT || MAX_MERKLE_TREE_HEIGHT > 256) {
      throw new Error(
        `Invalid Merkle height. Expected 8-256, got ${merkleHeight}`
      );
    }

    const zkAppProcessor = new ZkDbProcessor(merkleHeight);
    // Cache path required
    await zkAppProcessor.compile('');

    const imProof = ModelProof.getInstance();

    const previousProof = await imProof.findOne(
      { databaseName },
      { sort: { createdAt: -1 } }
    );

    // If previous proof not found, which mean first time create
    if (!previousProof) {
      const merkleTree = new MerkleTree(merkleHeight);
      const firstRollupProof = await zkAppProcessor.init(
        merkleTree.getRoot(),
        merkleTree.getWitness(0n)
      );
      // TODO: Since queue not implement I'll assume that we have rollup transaction
      // @ts-expect-error
      await zkAppProcessor.update(firstRollupProof, task.rollupTransition);
      return;
    }

    // Simulate get current merkle tree
    const previousProofFormat = await zkAppProcessor.deserialize(
      JSON.stringify(previousProof)
    );
    // @ts-expect-error: Since we don't have rollup transition yet
    await zkAppProcessor.update(previousProofFormat, task.rollupTransition);
  }
}
