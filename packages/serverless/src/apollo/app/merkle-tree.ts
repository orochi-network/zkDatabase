import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { databaseName, indexNumber } from './common';
import { TDatabaseRequest } from './database';
import ModelMerkleTree from '../../model/database/merkle-tree';

export type TMerkleTreeIndexRequest = TDatabaseRequest & {
  index: bigint;
};

export type TMerkleTreeGetNodeRequest = TMerkleTreeIndexRequest & {
  level: number;
};

export const MerkleTreeIndexRequest = Joi.object<TMerkleTreeIndexRequest>({
  databaseName,
  index: indexNumber,
});

export const MerkleTreeGetNodeRequest = Joi.object<TMerkleTreeGetNodeRequest>({
  databaseName,
  index: indexNumber,
  level: Joi.number().required(),
});

export const typeDefsMerkleTree = `#graphql
scalar JSON
type Query
type Mutation

type MerkleProof {
  isLeft: Boolean!
  sibling: String!
}

extend type Query {
  getNode(databaseName: String!, level: Int!, index: String!): String!
  getWitness(databaseName: String!, root: String!, index: String!): [MerkleProof]!
}
`;

const getWitness = resolverWrapper(
  MerkleTreeIndexRequest,
  async (_root: unknown, args: TMerkleTreeIndexRequest) => {
    const merkleTreeService = ModelMerkleTree.getInstance(
      args.databaseName
    );
    return merkleTreeService.getWitness(BigInt(args.index), new Date());
  }
);

const getNode = resolverWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) => {
    const merkleTreeService = ModelMerkleTree.getInstance(
      args.databaseName
    );
    return merkleTreeService.getNode(args.level, args.index, new Date());
  }
);

export const resolversMerkleTree = {
  JSON: GraphQLJSON,
  Query: {
    getWitness,
    getNode,
  },
};
