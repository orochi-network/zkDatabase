import { Field } from 'snarkyjs';
import Joi from 'joi';
import resolverWrapper, { validateDigest } from '../validation.js';
import { BigIntResolver } from 'graphql-scalars';
import getStorageEngine from '../../helper/ipfs-storage-engine.js';
import DistributedMerkleTree from '../../../merkle-tree/merkle-tree-ipfs.js';

// Define types for clarity and reusability
export interface IMerkleProof {
  digest: string;
  isLeft: boolean;
}

export const requestMerkleNode = Joi.object({
  index: Joi.allow().required(),
  level: Joi.number().integer().optional(),
});

export const mutationSetLeaf = Joi.object({
  index: Joi.allow().required(),
  digest: validateDigest.required(),
});

export const mutationSetLeaves = Joi.object({
  nodes: Joi.array().items(validateDigest).required(),
});

// GraphQL schema
export const typeDefsMerkleTree = `
  scalar BigInt

  type MerkleProof {
    digest: String!
    isLeft: Boolean!
  }

  extend type Query {
    getRoot: String!
    getMerkleProof(index: BigInt!): [MerkleProof]!
    getNode(index: BigInt!, level: Int): String!
  }

  extend type Mutation {
    setLeaf(index: BigInt!, digest: String!): Boolean
    fill(digests: [String!]!): Boolean
  }
`;

const getDistributedMerkleTree = async () => {
  const ipfs = await getStorageEngine();
  return new DistributedMerkleTree(ipfs, 8);
};

// Resolvers
export const resolversMerkleTree = {
  BigInt: BigIntResolver,
  Query: {
    getRoot: async (): Promise<string> => {
      const merkleTree = await getDistributedMerkleTree();
      return (await merkleTree.getRoot()).toString();
    },
    getMerkleProof: async (
      _: any,
      { index }: { index: BigInt }
    ): Promise<IMerkleProof[]> => {
      const merkleTree = await getDistributedMerkleTree();
      const witness = await merkleTree.getWitness(index.valueOf());
      return witness.map<IMerkleProof>((element) => ({
        digest: element.sibling.toString(),
        isLeft: element.isLeft,
      }));
    },
    getNode: resolverWrapper(
      requestMerkleNode,
      async (
        _: unknown,
        { index, level }: { index: BigInt; level: number }
      ): Promise<string> => {
        const merkleTree = await getDistributedMerkleTree();
        if (level === undefined) {
          level = merkleTree.height - 1;
        }
        const node = await merkleTree.getNode(level, BigInt(index.valueOf()));
        return node.toString();
      }
    ),
  },
  Mutation: {
    setLeaf: resolverWrapper(
      mutationSetLeaf,
      async (
        _: unknown,
        { index, digest }: { index: BigInt; digest: string }
      ): Promise<Boolean> => {
        const merkleTree = await getDistributedMerkleTree();
        await merkleTree.setLeaf(BigInt(index.valueOf()), Field.from(digest));
        return true;
      }
    ),
    fill: resolverWrapper(
      mutationSetLeaves,
      async (
        _: unknown,
        { digests }: { digests: string[] }
      ): Promise<Boolean> => {
        const merkleTree = await getDistributedMerkleTree();
        await merkleTree.fill(digests.map((digest) => Field(digest)));
        return true;
      }
    ),
  },
};
