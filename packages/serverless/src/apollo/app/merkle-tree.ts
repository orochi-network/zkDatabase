import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { BigIntResolver } from 'graphql-scalars';
import resolverWrapper from '../validation';
import { databaseName, indexNumber } from './common';
import { TDatabaseRequest } from './database';
import ModelMerkleTree from '../../model/merkle-tree';
import DistributedLock from '../../helper/distributed-lock';

export type TMerkleTreeInitializeRequest = TDatabaseRequest & {
  height: number;
};

export type TMerkleTreeIndexRequest = TDatabaseRequest & {
  index: string;
};

export type TMerkleTreeSetLeafRequest = TMerkleTreeIndexRequest & {
  hash: string;
};

export type TMerkleTreeBuildRequest = TMerkleTreeIndexRequest & {
  amount: number;
};

export type TMerkleTreeGetNodeRequest = TDatabaseRequest & {
  index: string;
  height: number;
};

export const MerkleTreeInitializeRequest =
  Joi.object<TMerkleTreeInitializeRequest>({
    databaseName,
    height: Joi.number().required(),
  });

export const MerkleTreeIndexRequest = Joi.object<TMerkleTreeIndexRequest>({
  databaseName,
  index: indexNumber,
});

export const MerkleTreeSetLeafRequest = Joi.object<TMerkleTreeSetLeafRequest>({
  databaseName,
  index: indexNumber,
  hash: Joi.string().required(),
});

export const MerkleTreeBuildRequest = Joi.object<TMerkleTreeBuildRequest>({
  databaseName,
  index: indexNumber,
  amount: Joi.number().required(),
});

export const MerkleTreeGetNodeRequest = Joi.object<TMerkleTreeGetNodeRequest>({
  databaseName,
  index: indexNumber,
  height: Joi.number().required(),
});

export const typeDefsMerkleTree = `#graphql
scalar BigInt
scalar JSON
type Query
type Mutation

type MerkleProof {
  digest: String!
  isLeft: Boolean!
}

extend type Query {
  getNode(databaseName: String!, level: Int!, index: BigInt!): String!
  getRoot(databaseName: String!): String!
  getWitness(databaseName: String!, index: BigInt!): [MerkleProof]!
}

extend type Mutation {
  create(databaseName: String!, height: Int!): Boolean
  build(databaseName: String!, amount: Int!): Boolean
  setLeaf(databaseName: String!, index: BigInt!, leaf: String!): Boolean
}
`;

const getRoot = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    return (await ModelMerkleTree.getInstance(args.databaseName)).getRoot();
  }
);

const create = resolverWrapper(
  MerkleTreeInitializeRequest,
  async (_root: unknown, args: TMerkleTreeInitializeRequest) => {
    const distributedLock = DistributedLock.getInstance();

    if (await distributedLock.acquireLock()) {
      try {
        await ModelMerkleTree.getInstance(args.databaseName, args.height);
      } finally {
        await distributedLock.releaseLock();
      }
    }
  }
);

const build = resolverWrapper(
  MerkleTreeBuildRequest,
  async (_root: unknown, args: TMerkleTreeBuildRequest) => {
    const distributedLock = DistributedLock.getInstance();

    if (await distributedLock.acquireLock()) {
      try {
        (await ModelMerkleTree.getInstance(args.databaseName)).build(
          args.amount
        );
      } finally {
        await distributedLock.releaseLock();
      }
    }
  }
);

const getWitness = resolverWrapper(
  MerkleTreeIndexRequest,
  async (_root: unknown, args: TMerkleTreeIndexRequest) => {
    return (await ModelMerkleTree.getInstance(args.databaseName)).getWitness(
      BigInt(args.index)
    );
  }
);

const setLeaf = resolverWrapper(
  MerkleTreeSetLeafRequest,
  async (_root: unknown, args: TMerkleTreeSetLeafRequest) => {
    return (await ModelMerkleTree.getInstance(args.databaseName)).addLeafToPool(
      BigInt(args.index),
      args.hash
    );
  }
);

const getNode = resolverWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) => {
    return (await ModelMerkleTree.getInstance(args.databaseName)).getNode(
      args.height,
      BigInt(args.index)
    );
  }
);

export const resolversMerkleTree = {
  BigInt: BigIntResolver,
  JSON: GraphQLJSON,
  Mutation: {
    setLeaf,
    create,
    build,
  },
  Query: {
    getWitness,
    getRoot,
    getNode,
  },
};
