import {
  TMerkleNodeJson,
  TMerkleProofSerialized,
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
    compoundSession: TCompoundSession
  ): Promise<TMerkleProofSerialized[]> {
    const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

    const docMetadata = await modelDocumentMetadata.findOne(
      {
        docId,
      },
      { session: compoundSession.sessionServerless }
    );

    if (!docMetadata) {
      throw Error(`Metadata has not been found`);
    }

    const merkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      compoundSession.sessionMina
    );

    return merkleTree.getMerkleProof(BigInt(docMetadata.merkleIndex), {
      session: compoundSession.sessionMina,
    });
  }

  public static async nodeByLevel(
    databaseName: string,
    nodeLevel: number,
    pagination: TPagination,
    session: ClientSession
  ): Promise<TPaginationReturn<TMerkleNodeJson[]>> {
    const imMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session
    );

    const listZeroNode = imMerkleTree.getListZeroNode();

    if (nodeLevel < imMerkleTree.height) {
      const listNode = (
        await imMerkleTree.getListNodeByLevel(nodeLevel, pagination, session)
      ).map(({ level, index, hash }) => ({
        level,
        index,
        hash,
        empty: listZeroNode[level].equals(Field(hash)).toBoolean(),
      }));

      return {
        data: listNode,
        offset: pagination?.offset ?? 0,
        total: await imMerkleTree.countNodeByLevel(nodeLevel, session),
      };
    }

    throw Error('Node Level must be less then Merkle Tree Height');
  }

  public static async info(
    databaseName: string,
    session: ClientSession
  ): Promise<TMerkleTreeInfo> {
    const imMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session
    );

    const merkleRoot = (await imMerkleTree.getRoot({ session })).toString();

    return {
      merkleRoot,
      merkleHeight: imMerkleTree.height,
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

    const imMerkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      session
    );

    if (parentLevel >= imMerkleTree.height) {
      throw new Error(
        `Invalid parentLevel: ${parentLevel}. The Merkle Tree has a height of ${imMerkleTree.height}.`
      );
    }

    const childrenLevel = parentLevel - 1;
    const leftChildIndex = parentIndex * 2n;
    const rightChildIndex = leftChildIndex + 1n;

    const leftNodeField = await imMerkleTree.getNode(
      childrenLevel,
      leftChildIndex,
      session
    );
    const rightNodeField = await imMerkleTree.getNode(
      childrenLevel,
      rightChildIndex,
      session
    );

    const listZeroNode = imMerkleTree.getListZeroNode();

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
    compoundSession: TCompoundSession
  ) {
    const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

    const docMetadata = await modelDocumentMetadata.findOne(
      {
        docId,
      },
      { session: compoundSession.sessionServerless }
    );

    if (!docMetadata) {
      throw Error(`Metadata has not been found`);
    }

    const merkleTree = await ModelMerkleTree.getInstance(
      databaseName,
      compoundSession.sessionMina
    );

    return merkleTree.getMerkleProofPath(BigInt(docMetadata.merkleIndex), {
      session: compoundSession.sessionMina,
    });
  }
}
