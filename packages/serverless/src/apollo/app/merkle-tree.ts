import { Field } from 'o1js';
import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { BigIntResolver } from 'graphql-scalars';
import resolverWrapper from '../validation';
import { databaseName, indexNumber } from './common';
import { TDatabaseRequest } from './database';
import DistributedLock from '../../helper/distributed-lock';
import MerkleTreeService from '../../service/MerkleTreeService';

export type TMerkleTreeInitializeRequest = TDatabaseRequest & {
  height: number;
};

export type TMerkleTreeStateRequest = TDatabaseRequest & {
  root: string;
};

export type TMerkleTreeIndexRequest = TMerkleTreeStateRequest & {
  index: string;
};

export type TMerkleTreeSetLeafRequest = TMerkleTreeIndexRequest & {
  hash: string;
};

export type TMerkleTreeBuildRequest = TMerkleTreeIndexRequest & {
  amount: number;
};

export type TMerkleTreeGetNodeRequest = TMerkleTreeStateRequest & {
  index: string;
  level: number;
};

export const MerkleTreeInitializeRequest =
  Joi.object<TMerkleTreeInitializeRequest>({
    databaseName,
    height: Joi.number().required(),
  });

export const MerkleTreeIndexRequest = Joi.object<TMerkleTreeIndexRequest>({
  databaseName,
  root: Joi.string().required(),
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
  root: Joi.string().required(),
  index: indexNumber,
  level: Joi.number().required(),
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
  getWitness(databaseName: String!, index: BigInt!): [MerkleProof]!
}

extend type Mutation {
  create(databaseName: String!, height: Int!): Boolean
  build(databaseName: String!, amount: Int!): Boolean
  setLeaf(databaseName: String!, index: BigInt!, leaf: String!): Boolean
}
`;

const create = resolverWrapper(
  MerkleTreeInitializeRequest,
  async (_root: unknown, args: TMerkleTreeInitializeRequest) => {
    const distributedLock = DistributedLock.getInstance();

    if (await distributedLock.acquireLock()) {
      try {
        const merkleTreeService = await MerkleTreeService.getInstance(
          args.databaseName
        );
        await merkleTreeService.create(args.height);
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
        const merkleTreeService = await MerkleTreeService.getInstance(
          args.databaseName
        );
        await merkleTreeService.build(args.amount);
      } finally {
        await distributedLock.releaseLock();
      }
    }
  }
);

const getWitness = resolverWrapper(
  MerkleTreeIndexRequest,
  async (_root: unknown, args: TMerkleTreeIndexRequest) => {
    const merkleTreeService = await MerkleTreeService.getInstance(
      args.databaseName
    );
    return merkleTreeService.getWitness(Field(args.root), BigInt(args.index));
  }
);

const setLeaf = resolverWrapper(
  MerkleTreeSetLeafRequest,
  async (_root: unknown, args: TMerkleTreeSetLeafRequest) => {
    const merkleTreeService = await MerkleTreeService.getInstance(
      args.databaseName
    );
    return merkleTreeService.addLeafToPool(
      BigInt(args.index),
      Field(args.hash)
    );
  }
);

const getNode = resolverWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) => {
    const merkleTreeService = await MerkleTreeService.getInstance(
      args.databaseName
    );
    return merkleTreeService.getNode(
      Field(args.root),
      args.level,
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
    getNode,
  },
};
