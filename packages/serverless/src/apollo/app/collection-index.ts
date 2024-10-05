import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import {
  createIndex,
  doesIndexExist,
  dropIndex,
  listIndexes,
  listIndexesInfo as listIndexesInfoDomain,
} from '../../domain/use-case/collection.js';
import { authorizeWrapper } from '../validation.js';
import { TCollectionRequest, CollectionRequest } from './collection.js';
import { collectionName, databaseName, indexName, indexes } from './common.js';

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
});

export const IndexCreateRequest = Joi.object<TIndexCreateRequest>({
  collectionName,
  databaseName,
  indexes,
});

export type CollectionIndex = {
  name: string;
  size: number;
  accesses: number;
  since: Date;
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
      indexes: [String]!
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
    withTransaction((session) =>
      listIndexes(args.databaseName, ctx.userName, args.collectionName, session)
    )
);

const indexListInfo = authorizeWrapper(
  IndexListRequest,
  async (_root: unknown, args: TIndexListRequest, ctx) =>
    listIndexesInfoDomain(args.databaseName, args.collectionName, ctx.userName)
);

const indexExist = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx) =>
    withTransaction((session) =>
      doesIndexExist(
        args.databaseName,
        ctx.userName,
        args.collectionName,
        args.indexName,
        session
      )
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
