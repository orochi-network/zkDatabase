/* eslint-disable import/prefer-default-export */
import {
  TMerkleNodeJson,
  TMerkleProof,
  TMerkleTreeInfo,
  TPagination,
  TPaginationReturn,
} from '@zkdb/common';
import { ModelMerkleTree, TCompoundSession } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Field } from 'o1js';
import { ModelMetadataDocument } from '@model';

export class MerkleTree {
  public static async document(
    databaseName: string,
    docId: string,
    session: ClientSession
  ): Promise<TMerkleProof[]> {
    const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

    const docMetadata = await modelDocumentMetadata.findOne(
      {
        docId,
      },
      { session }
    );

    if (!docMetadata) {
      throw Error(`Metadata has not been found`);
    }

    const merkleTree = await ModelMerkleTree.getInstance(databaseName, session);

    return merkleTree.getMerkleProof(BigInt(docMetadata.merkleIndex), {
      session,
    });
  }

  public static async nodeByLevel(
    databaseName: string,
    nodeLevel: number,
    pagination: TPagination,
    session: ClientSession
  ): Promise<TPaginationReturn<TMerkleNodeJson[]>> {
    const modelMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session
    );

    const listZeroNode = modelMerkleTree.getListZeroNode();

    if (nodeLevel < modelMerkleTree.height) {
      const listNode = (
        await modelMerkleTree.getListNodeByLevel(nodeLevel, pagination, session)
      ).map(({ level, index, hash }) => ({
        level,
        index,
        hash,
        empty: listZeroNode[level].equals(Field(hash)).toBoolean(),
      }));

      return {
        data: listNode,
        offset: pagination?.offset ?? 0,
        total: await modelMerkleTree.countNodeByLevel(nodeLevel, session),
      };
    }

    throw Error('Node Level must be less then Merkle Tree Height');
  }

  public static async info(
    databaseName: string,
    session: ClientSession
  ): Promise<TMerkleTreeInfo> {
    const modelMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session
    );

    const merkleRoot = (await modelMerkleTree.getRoot({ session })).toString();

    return {
      merkleRoot,
      merkleHeight: modelMerkleTree.height,
    };
  }

  public static async nodeChildren(
    databaseName: string,
    parentLevel: number,
    parentIndex: bigint,
    session: ClientSession
  ): Promise<TMerkleNodeJson[]> {
    if (!Number.isInteger(parentLevel) || parentLevel <= 0) {
      throw new Error(
        `Invalid parentLevel: ${parentLevel}. It must be a greater than zero integer.`
      );
    }

    const modelMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session
    );

    if (parentLevel >= modelMerkleTree.height) {
      throw new Error(
        `Invalid parentLevel: ${parentLevel}. The Merkle Tree has a height of ${modelMerkleTree.height}.`
      );
    }

    const childrenLevel = parentLevel - 1;
    const leftChildIndex = parentIndex * 2n;
    const rightChildIndex = leftChildIndex + 1n;

    const leftNodeField = await modelMerkleTree.getNode(
      childrenLevel,
      leftChildIndex,
      session
    );
    const rightNodeField = await modelMerkleTree.getNode(
      childrenLevel,
      rightChildIndex,
      session
    );

    const listZeroNode = modelMerkleTree.getListZeroNode();

    return [
      {
        hash: leftNodeField.toString(),
        index: leftChildIndex,
        level: childrenLevel,
        empty: listZeroNode[childrenLevel].equals(leftNodeField).toBoolean(),
      },
      {
        hash: rightNodeField.toString(),
        index: rightChildIndex,
        level: childrenLevel,
        empty: listZeroNode[childrenLevel].equals(rightNodeField).toBoolean(),
      },
    ];
  }

  public static async nodePath(
    databaseName: string,
    docId: string,
    session: TCompoundSession
  ) {
    const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

    const docMetadata = await modelDocumentMetadata.findOne(
      {
        docId,
      },
      { session: session.serverless }
    );

    if (!docMetadata) {
      throw Error(`Metadata has not been found`);
    }

    const merkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session.proofService
    );

    return merkleTree.getMerkleProofPath(BigInt(docMetadata.merkleIndex), {
      session: session.proofService,
    });
  }
}
