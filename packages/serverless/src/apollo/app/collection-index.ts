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
  collectionIndex,
  collectionName,
  databaseName,
  indexName,
  indexes,
} from './common.js';
import { TCollectionIndex } from '../types/collection-index.js';

// Index request
export type TIndexNameRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export const IndexListRequest = CollectionRequest;

export type TIndexRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & {
  indexes: TCollectionIndex[];
};

export type TIndexDetailRequest = TIndexRequest & TIndexNameRequest;

export const IndexDetailRequest = Joi.object<TIndexDetailRequest>({
  collectionName,
  databaseName,
  indexName,
});

export const IndexCreateRequest = Joi.object<TIndexCreateRequest>({
  collectionName,
  databaseName,
  indexes: Joi.array().items(collectionIndex),
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
    indexList(databaseName: String!, collectionName: String!): [String]!
    indexListInfo(databaseName: String!, collectionName: String!): [CollectionIndex]!
    indexExist(
      databaseName: String!
      collectionName: String!
      indexName: String!
    ): Boolean
  }

  extend type Mutation {
    indexCreate(
      databaseName: String!
      collectionName: String!
      indexes: [IndexInput!]!
    ): Boolean
    indexDrop(
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
    listIndexes(args.databaseName, ctx.userName, args.collectionName)
);

const indexListInfo = authorizeWrapper(
  IndexListRequest,
  async (_root: unknown, args: TIndexListRequest, ctx) =>
    listIndexesInfoDomain(args.databaseName, args.collectionName, ctx.userName)
);

const indexExist = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx) =>
    doesIndexExist(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexName
    )
);

// Mutation
const indexCreate = authorizeWrapper(
  IndexCreateRequest,
  async (_root: unknown, args: TIndexCreateRequest, ctx) =>
    createIndex(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexes
    )
);

const indexDrop = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx) =>
    dropIndex(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexName
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
