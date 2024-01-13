import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { BigIntResolver } from 'graphql-scalars';
import resolverWrapper from '../validation';
import { databaseName, indexNumber } from './common';
import { TDatabaseRequest } from './database';
import ModelMerkleTreePool from '../../model/merkle-tree-pool';

export type TMerkleTreeIndexRequest = TDatabaseRequest & {
  index: string;
};

export type TMerkleTreeSetLeafRequest = TMerkleTreeIndexRequest & {
  leaf: string;
};

export const MerkleTreeSetLeafRequest = Joi.object<TMerkleTreeSetLeafRequest>({
  databaseName,
  index: indexNumber,
  leaf: Joi.string().required(),
});

export const typeDefsMerkleTree = `#graphql
scalar BigInt
scalar JSON
type Query
type Mutation

extend type Mutation {
  setLeaf(databaseName: String!, index: BigInt!, leaf: String!): Boolean
}
`;

const setLeaf = resolverWrapper(
  MerkleTreeSetLeafRequest,
  async (_root: unknown, args: TMerkleTreeSetLeafRequest) => {
    return ModelMerkleTreePool.getInstance(args.databaseName).saveLeaf(
      BigInt(args.index),
      args.leaf
    );
  }
);

export const resolversMerkleTree = {
  BigInt: BigIntResolver,
  JSON: GraphQLJSON,
  Mutation: {
    setLeaf,
  },
};
