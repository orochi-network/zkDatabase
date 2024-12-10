import { ModelMerkleTree } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import { Field } from 'o1js';
import {
  TMerkleNode,
  TMerkleProof,
  TMerkleTreeInfo,
  TPaginationReturn,
  TPagination,
  TMerkleJson,
} from '@zkdb/common';

export async function getWitnessByDocumentId(
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

  const merkleTree = await ModelMerkleTree.load(databaseName);

  return merkleTree.getWitness(BigInt(docMetadata.merkleIndex), new Date(), {
    session,
  });
}

export async function getMerkleNodesByLevel(
  databaseName: string,
  nodeLevel: number,
  pagination?: TPagination
): Promise<TPaginationReturn<TMerkleJson<TMerkleNode>[]>> {
  const modelMerkleTree = await ModelMerkleTree.load(databaseName);

  const zeroNodes = modelMerkleTree.getZeroNodes();

  if (nodeLevel < modelMerkleTree.height) {
    const nodes = (
      await modelMerkleTree.getNodesByLevel(nodeLevel, new Date(), {
        ...pagination,
      })
    ).map(({ level, index, hash }) => ({
      level,
      index,
      hash,
      empty: zeroNodes[level].equals(Field(hash)).toBoolean(),
    }));

    return {
      data: nodes,
      offset: pagination?.offset ?? 0,
      total: await modelMerkleTree.countLatestNodesByLevel(
        nodeLevel,
        new Date()
      ),
    };
  }

  throw Error('Node Level must be less then Merkle Tree Height');
}

export async function getMerkleTreeInfo(
  databaseName: string
): Promise<TMerkleTreeInfo> {
  const modelMerkleTree = await ModelMerkleTree.load(databaseName);

  const merkleRoot = (await modelMerkleTree.getRoot(new Date())).toString();

  return {
    merkleRoot,
    merkleHeight: modelMerkleTree.height,
  };
}

export async function getChildrenNodes(
  databaseName: string,
  parentLevel: number,
  parentIndex: bigint
): Promise<TMerkleJson<TMerkleNode>[]> {
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

  const modelMerkleTree = await ModelMerkleTree.load(databaseName);

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

  const zeroNodes = modelMerkleTree.getZeroNodes();

  return [
    {
      hash: leftNodeField.toString(),
      index: Number(leftChildIndex),
      level: childrenLevel,
      empty: zeroNodes[childrenLevel].equals(leftNodeField).toBoolean(),
    },
    {
      hash: rightNodeField.toString(),
      index: Number(rightChildIndex),
      level: childrenLevel,
      empty: zeroNodes[childrenLevel].equals(rightNodeField).toBoolean(),
    },
  ];
}

export async function getMerkleWitnessPath(
  databaseName: string,
  docId: string
) {
  const modelDocumentMetadata = new ModelMetadataDocument(databaseName);

  const docMetadata = await modelDocumentMetadata.findOne({
    docId,
  });

  if (!docMetadata) {
    throw Error(`Metadata has not been found`);
  }

  const merkleTree = await ModelMerkleTree.load(databaseName);

  return merkleTree.getWitnessPath(BigInt(docMetadata.merkleIndex), new Date());
}
