import {
  TMerkleNodeDetailJson,
  TMerkleNodeJson,
  TMerkleProof,
  TMerkleTreeInfo,
  TPagination,
  TPaginationReturn,
} from '@zkdb/common';
import { ModelMerkleTree } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Field } from 'o1js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';

export class MerkleTree {
  public static async document(
    databaseName: string,
    docId: string,
    session?: ClientSession
  ): Promise<TMerkleProof[]> {
    const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

    const docMetadata = await modelDocumentMetadata.findOne({
      docId,
    });

    if (!docMetadata) {
      throw Error(`Metadata has not been found`);
    }

    const merkleTree = await ModelMerkleTree.getInstance(databaseName);

    return merkleTree.getMerkleProof(
      BigInt(docMetadata.merkleIndex),
      new Date(),
      {
        session,
      }
    );
  }

  public static async merkleNodeByLevel(
    databaseName: string,
    nodeLevel: number,
    pagination?: TPagination
  ): Promise<TPaginationReturn<TMerkleNodeJson[]>> {
    const modelMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    const listZeroNode = modelMerkleTree.getListZeroNode();

    if (nodeLevel < modelMerkleTree.height) {
      const listNode = (
        await modelMerkleTree.getListNodeByLevel(nodeLevel, new Date(), {
          ...pagination,
        })
      ).map(({ level, index, hash }) => ({
        level,
        index,
        hash,
        empty: listZeroNode[level].equals(Field(hash)).toBoolean(),
      }));

      return {
        data: listNode,
        offset: pagination?.offset ?? 0,
        total: await modelMerkleTree.countLatestNodeByLevel(
          nodeLevel,
          new Date()
        ),
      };
    }

    throw Error('Node Level must be less then Merkle Tree Height');
  }

  public static async merkleTreeInfo(
    databaseName: string
  ): Promise<TMerkleTreeInfo> {
    const modelMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    const merkleRoot = (await modelMerkleTree.getRoot(new Date())).toString();

    return {
      merkleRoot,
      merkleHeight: modelMerkleTree.height,
    };
  }

  public static async getChildrenNode(
    databaseName: string,
    parentLevel: number,
    parentIndex: bigint
  ): Promise<TMerkleNodeJson[]> {
    if (!Number.isInteger(parentLevel) || parentLevel < 0) {
      throw new Error(
        `Invalid parentLevel: ${parentLevel}. It must be a non-negative integer.`
      );
    }

    if (parentIndex < 0) {
      throw new Error(
        `Invalid parentIndex: ${parentIndex}. It must be a non-negative integer.`
      );
    }

    if (parentLevel <= 0) {
      throw new Error(
        `Invalid parentLevel: ${parentLevel}. Leaves do not have children nodes.`
      );
    }

    const modelMerkleTree = await ModelMerkleTree.getInstance(databaseName);

    if (parentLevel >= modelMerkleTree.height) {
      throw new Error(
        `Invalid parentLevel: ${parentLevel}. The Merkle Tree has a height of ${modelMerkleTree.height}.`
      );
    }

    const currentDate = new Date();

    const childrenLevel = parentLevel - 1;
    const leftChildIndex = parentIndex * 2n;
    const rightChildIndex = leftChildIndex + 1n;

    const leftNodeField = await modelMerkleTree.getNode(
      childrenLevel,
      leftChildIndex,
      currentDate
    );
    const rightNodeField = await modelMerkleTree.getNode(
      childrenLevel,
      rightChildIndex,
      currentDate
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

  public static async merkleProofPath(databaseName: string, docId: string) {
    const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

    const docMetadata = await modelDocumentMetadata.findOne({
      docId,
    });

    if (!docMetadata) {
      throw Error(`Metadata has not been found`);
    }

    const merkleTree = await ModelMerkleTree.getInstance(databaseName);

    return merkleTree.getMerkleProofPath(
      BigInt(docMetadata.merkleIndex),
      new Date()
    );
  }
}

export default { MerkleTree };
