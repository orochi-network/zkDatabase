import { ModelMerkleTree, TMerkleProof } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import { Pagination, PaginationReturn } from '../types/pagination.js';
import { MerkleNode, MerkleTreeInfo } from '../types/merkle-tree.js';
import { Field } from 'o1js';
import { NetworkId } from '../types/network.js';

// eslint-disable-next-line import/prefer-default-export
export async function getWitnessByDocumentId(
  networkId: NetworkId,
  databaseName: string,
  docId: string,
  session?: ClientSession
): Promise<TMerkleProof[]> {
  const modelDocumentMetadata = ModelDocumentMetadata.getInstance(databaseName, networkId);

  const docMetadata = await modelDocumentMetadata.findOne({
    docId,
  });

  if (!docMetadata) {
    throw Error(`Metadata has not been found`);
  }

  const merkleTree = await ModelMerkleTree.load(databaseName, networkId);

  return merkleTree.getWitness(BigInt(docMetadata.merkleIndex), new Date(), {
    session,
  });
}

export async function getMerkleNodesByLevel(
  networkId: NetworkId,
  databaseName: string,
  nodeLevel: number,
  pagination?: Pagination
): Promise<PaginationReturn<MerkleNode[]>> {
  const modelMerkleTree = await ModelMerkleTree.load(databaseName, networkId);

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
      empty: zeroNodes[level].equals(Field(hash)).toBoolean()
    }));

    return {
      data: nodes,
      offset: pagination?.offset ?? 0,
      totalSize: await modelMerkleTree.countLatestNodesByLevel(
        nodeLevel,
        new Date()
      ),
    };
  }

  throw Error('Node Level must be less then Merkle Tree Height');
}

export async function getMerkleTreeInfo(
  networkId: NetworkId,
  databaseName: string
): Promise<MerkleTreeInfo> {
  const modelMerkleTree = await ModelMerkleTree.load(databaseName, networkId);

  const merkleRoot = (await modelMerkleTree.getRoot(new Date())).toString();

  return {
    merkleRoot,
    merkleHeight: modelMerkleTree.height,
  };
}

export async function getChildrenNodes(
  networkId: NetworkId,
  databaseName: string,
  parentLevel: number,
  parentIndex: bigint
): Promise<MerkleNode[]> {
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

  const modelMerkleTree = await ModelMerkleTree.load(databaseName, networkId);

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
  networkId: NetworkId,
  databaseName: string,
  docId: string
) {
  const modelDocumentMetadata = ModelDocumentMetadata.getInstance(databaseName, networkId);

  const docMetadata = await modelDocumentMetadata.findOne({
    docId,
  });

  if (!docMetadata) {
    throw Error(`Metadata has not been found`);
  }

  const merkleTree = await ModelMerkleTree.load(databaseName, networkId);

  return merkleTree.getWitnessPath(BigInt(docMetadata.merkleIndex), new Date());
}
