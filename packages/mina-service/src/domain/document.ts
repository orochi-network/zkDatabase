/* eslint-disable import/prefer-default-export */
import {
  EDocumentOperation,
  getCurrentTime,
  ModelMerkleTree,
  ModelQueueTask,
  ModelTransitionLog,
  TDocumentQueuedData,
  TGenericQueue,
} from '@zkdb/storage';
import { TDbRecord } from '@zkdb/common';
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
      },
    } = task;
    assert(sequenceNumber !== null, 'Sequence number should not be null');

    const imMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      proofSession
    );

    const leafOld = (
      await imMerkleTree.getNode(0, merkleIndex, {
        session: proofSession,
      })
    ).toString();

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

    const merkleWitness = await imMerkleTree
      .getMerkleProof(merkleIndex, {
        session: proofSession,
      })
      .then((result) =>
        result.map((proof) => ({
          ...proof,
          sibling: proof.sibling.toString(),
        }))
      );

    const merkleRootNew = await imMerkleTree
      .getRoot({ session: proofSession })
      .then((root) => root.toString());

    const transitionLogObjectId = await ModelTransitionLog.getInstance(
      databaseName,
      proofSession
    ).then((imModelTransitionLog) =>
      imModelTransitionLog.collection
        .insertOne(
          {
            merkleRootNew,
            merkleProof: merkleWitness,
            leafOld,
            leafNew,
            operationNumber: sequenceNumber,
            createdAt: getCurrentTime(),
            updatedAt: getCurrentTime(),
          },
          { session: proofSession }
        )
        .then((result) => result.insertedId)
    );

    await ModelQueueTask.getInstance().queueTask(
      {
        databaseName,
        collectionName,
        operationNumber: sequenceNumber,
        transitionLogObjectId,
        docId,
      },
      { session: proofSession }
    );
  }
}
