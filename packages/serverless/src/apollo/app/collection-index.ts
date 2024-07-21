import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import { resolverWrapper } from '../validation';
import { TCollectionRequest, CollectionRequest } from './collection';
import { collectionName, databaseName, indexName, indexField } from './common';
import {
  createIndex,
  dropIndex,
  listIndexes,
  doesIndexExist,
} from '../../domain/use-case/collection';
import { AppContext } from '../../common/types';

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
  indexExist(databaseName: String!, collectionName: String!, indexName: String!): Boolean
}

extend type Mutation {
  indexCreate(databaseName: String!, collectionName: String!, indexField: [String]!): Boolean
  indexDrop(databaseName: String!, collectionName: String!, indexName: String!): Boolean
}
`;

// Query
const indexList = resolverWrapper(
  IndexListRequest,
  async (_root: unknown, args: TIndexListRequest, ctx: AppContext) =>
    withTransaction((session) =>
      listIndexes(args.databaseName, ctx.userName, args.collectionName, session)
    )
);

const indexExist = resolverWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx: AppContext) =>
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
const indexCreate = resolverWrapper(
  IndexCreateRequest,
  async (_root: unknown, args: TIndexCreateRequest, ctx: AppContext) =>
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

const indexDrop = resolverWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, ctx: AppContext) =>
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
