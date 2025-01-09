import {
  ModelMerkleTree,
  ModelQueueTask,
  TCompoundSession,
  TDocumentQueuedData,
  TGenericQueue,
} from '@zkdb/storage';
import { TDbRecord } from '@zkdb/common';
import { Field } from 'o1js';
import assert from 'node:assert';

export enum EDocumentOperation {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

export class DocumentProcessor {
  /** Update merkle tree and queue new proof task */
  static async onTask(
    task: TDbRecord<TGenericQueue<TDocumentQueuedData>>,
    session: TCompoundSession
  ) {
    const {
      databaseName,
      sequenceNumber,
      data: { merkleIndex, updatedDocumentHash, collectionName },
    } = task;
    assert(sequenceNumber !== null, 'Sequence number should not be null');

    const leafNew = Field(updatedDocumentHash);

    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    const leafOld = await imMerkleTree.getNode(0, merkleIndex, {
      session: session.serverless,
    });

    await imMerkleTree.setLeaf(merkleIndex, leafNew, session.serverless);

    const merkleWitness = await imMerkleTree.getMerkleProof(merkleIndex, {
      session: session.serverless,
    });

    await ModelQueueTask.getInstance().queueTask(
      {
        databaseName,
        collectionName,
        operationNumber: sequenceNumber,
        merkleIndex,
        merkleWitness,
        merkleRoot: await imMerkleTree.getRoot({ session: session.serverless }),
        leafOld,
        leafNew,
      } as any, // TODO: Fix this type cast once the queue is updated to the new schema
      { session: session.proofService }
    );
  }
}
