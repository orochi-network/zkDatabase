import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import {
  createIndex,
  doesIndexExist,
  dropIndex,
  listIndexes,
} from '../../domain/use-case/collection.js';
import { authorizeWrapper } from '../validation.js';
import { TCollectionRequest, CollectionRequest } from './collection.js';
import {
  collectionName,
  databaseName,
  indexName,
  indexField,
} from './common.js';

// Index request
export type TIndexNameRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export const IndexListRequest = CollectionRequest;

export type TIndexRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & {
  indexField: string[];
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
  indexField,
});

export const typeDefsCollectionIndex = `#graphql
  scalar JSON
  type Query
  type Mutation

  extend type Query {
    indexList(databaseName: String!, collectionName: String!): [String]!
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
      indexField: [String]!
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
    withTransaction((session) =>
      createIndex(
        args.databaseName,
        ctx.userName,
        args.collectionName,
        args.indexField,
        session
      )
    )
);

const indexDrop = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx) =>
    withTransaction((session) =>
      dropIndex(
        args.databaseName,
        ctx.userName,
        args.collectionName,
        args.indexName,
        session
      )
    )
);

type TCollectionIndexResolvers = {
  JSON: typeof GraphQLJSON;
  Query: {
    indexList: typeof indexList;
    indexExist: typeof indexExist;
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
  },
  Mutation: {
    indexCreate,
    indexDrop,
  },
};
