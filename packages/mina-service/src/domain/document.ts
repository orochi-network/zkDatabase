import {
  getCurrentTime,
  ModelMerkleTree,
  ModelQueueTask,
  ModelTransitionProof,
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
    { proofService: session }: TCompoundSession
  ) {
    const {
      databaseName,
      sequenceNumber,
      data: { merkleIndex, updatedDocumentHash, collectionName },
    } = task;
    assert(sequenceNumber !== null, 'Sequence number should not be null');

    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    const leafOld = (
      await imMerkleTree.getNode(0, merkleIndex, {
        session,
      })
    ).toString();

    await imMerkleTree.setLeaf(
      merkleIndex,
      Field(updatedDocumentHash),
      session
    );

    const merkleWitness = await imMerkleTree.getMerkleProof(merkleIndex, {
      session,
    });

    const transitionProofObjectId = await ModelTransitionProof.getInstance(
      databaseName
    ).then(async (modelTransitionProof) => {
      return modelTransitionProof.collection
        .insertOne({
          merkleRootNew: (await imMerkleTree.getRoot({ session })).toString(),
          merkleProof: merkleWitness,
          leafOld,
          leafNew: updatedDocumentHash,
          operationNumber: sequenceNumber,
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
        })
        .then((result) => result.insertedId);
    });

    await ModelQueueTask.getInstance().queueTask(
      {
        databaseName,
        collectionName,
        operationNumber: sequenceNumber,
        transitionProofObjectId,
      },
      { session }
    );
  }
}
