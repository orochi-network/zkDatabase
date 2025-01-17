/* eslint-disable import/prefer-default-export */
import {
  ModelGenericQueue,
  ModelMerkleTree,
  ModelTransitionLog,
  zkDatabaseConstant,
} from '@zkdb/storage';
import {
  EDocumentOperation,
  TDbRecord,
  TDocumentQueuedData,
  TGenericQueue,
  TRollupQueueData,
} from '@zkdb/common';
import { Field } from 'o1js';
import assert from 'node:assert';
import { ClientSession } from 'mongodb';

export class DocumentProcessor {
  /** Update merkle tree and queue new proof task */
  static async onTask(
    task: TDbRecord<TGenericQueue<TDocumentQueuedData>>,
    proofSession: ClientSession
  ) {
    const {
      databaseName,
      sequenceNumber,
      data: {
        merkleIndex,
        operationKind,
        newDocumentHash,
        collectionName,
        docId,
        documentObjectIdPrevious,
        documentObjectIdCurrent,
      },
    } = task;
    assert(sequenceNumber !== null, 'Sequence number should not be null');

    const imMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      proofSession
    );

    const leafOld = await imMerkleTree.getNode(0, merkleIndex, {
      session: proofSession,
    });

    if (operationKind !== EDocumentOperation.Delete && !newDocumentHash) {
      throw new Error(
        'New document hash is required for create and update operations'
      );
    }

    const leafNew =
      operationKind === EDocumentOperation.Delete
        ? Field(0).toString()
        : newDocumentHash!;

    await imMerkleTree.setLeaf(merkleIndex, Field(leafNew), proofSession);

    const merkleProof = await imMerkleTree.getMerkleProof(merkleIndex, {
      session: proofSession,
    });

    const merkleRootNew = (
      await imMerkleTree.getRoot({ session: proofSession })
    ).toString();

    const imModelTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
      proofSession
    );

    const transitionLogObjectId =
      await imModelTransitionLog.collection.insertOne(
        {
          merkleRootNew,
          merkleProof,
          leafOld,
          leafNew,
          operationNumber: sequenceNumber,
          documentObjectIdPrevious,
          documentObjectIdCurrent,
          operationKind,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { session: proofSession }
      );

    (
      await ModelGenericQueue.getInstance<TRollupQueueData>(
        zkDatabaseConstant.globalCollection.rollupOffChainQueue,
        proofSession
      )
    ).queueTask({
      data: {
        databaseName,
        collectionName,
        operationNumber: sequenceNumber,
        transitionLogObjectId: transitionLogObjectId.insertedId,
        docId,
      },
      databaseName,
      sequenceNumber,
    });
  }
}
