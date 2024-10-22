import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createIndex,
  doesIndexExist,
  dropIndex,
  listIndexes,
  listIndexesInfo as listIndexesInfoDomain,
} from '../../domain/use-case/collection.js';
import { authorizeWrapper } from '../validation.js';
import { CollectionRequest, TCollectionRequest } from './collection.js';
import {
  collectionName,
  databaseName,
  indexName,
  indexes,
  networkId,
} from './common.js';

// Index request
export type TIndexNameRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export const IndexListRequest = CollectionRequest;

export type TIndexRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & {
  indexes: string[];
};

export type TIndexDetailRequest = TIndexRequest & TIndexNameRequest;

export const IndexDetailRequest = Joi.object<TIndexDetailRequest>({
  collectionName,
  databaseName,
  indexName,
  networkId,
});

export const IndexCreateRequest = Joi.object<TIndexCreateRequest>({
  collectionName,
  databaseName,
  indexes,
  networkId,
});

export type CollectionIndex = {
  name: string;
  size: number;
  accesses: number;
  since: Date;
  properties: 'compound' | 'unique';
};

export const typeDefsCollectionIndex = `#graphql
  scalar JSON
  scalar Date
  type Query
  type Mutation

  type CollectionIndex {
    name: String!
    size: Int!
    accesses: Int!
    since: Date!
    properties: String!
  }

  extend type Query {
    indexList(networkId: NetworkId!, databaseName: String!, collectionName: String!): [String]!
    indexListInfo(networkId: NetworkId!, databaseName: String!, collectionName: String!): [CollectionIndex]!
    indexExist(
      networkId: NetworkId!,
      databaseName: String!
      collectionName: String!
      indexName: String!
    ): Boolean
  }

  extend type Mutation {
    indexCreate(
      networkId: NetworkId!,
      databaseName: String!
      collectionName: String!
      indexes: [String]!
    ): Boolean
    indexDrop(
      networkId: NetworkId!,
      databaseName: String!
      collectionName: String!
      indexName: String!
    ): Boolean
  }
`;

// Query
const indexList = authorizeWrapper(
  IndexListRequest,
  async (_root: unknown, args: TIndexListRequest, ctx) =>
    listIndexes(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.networkId
    )
);

const indexListInfo = authorizeWrapper(
  IndexListRequest,
  async (_root: unknown, args: TIndexListRequest, ctx) =>
    listIndexesInfoDomain(
      args.databaseName,
      args.collectionName,
      ctx.userName,
      args.networkId
    )
);

const indexExist = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx) =>
    doesIndexExist(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexName,
      args.networkId
    )
);

// Mutation
const indexCreate = authorizeWrapper(
  IndexCreateRequest,
  async (_root: unknown, args: TIndexCreateRequest, ctx) =>
    createIndex(
      args.networkId,
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexes,
    )
);

const indexDrop = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx) =>
    dropIndex(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexName,
      args.networkId
    )
);

type TCollectionIndexResolvers = {
  JSON: typeof GraphQLJSON;
  Query: {
    indexList: typeof indexList;
    indexExist: typeof indexExist;
    indexListInfo: typeof indexListInfo;
  };
  Mutation: {
    indexCreate: typeof indexCreate;
    indexDrop: typeof indexDrop;
  };
};

export const resolversCollectionIndex: TCollectionIndexResolvers = {
  JSON: GraphQLJSON,
  Query: {
    indexList,
    indexExist,
    indexListInfo,
  },
  Mutation: {
    indexCreate,
    indexDrop,
  },
};
