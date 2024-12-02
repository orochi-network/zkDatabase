import GraphQLJSON from 'graphql-type-json';
import { gql } from 'helper/common.js';
import Joi from 'joi';
import {
  createIndex,
  doesIndexExist,
  dropIndex,
  listIndexes,
  listIndexesInfo as listIndexesInfoDomain,
} from '../../domain/use-case/collection.js';
import { TCollectionIndex } from '../../types/index';
import { authorizeWrapper } from '../validation.js';
import { CollectionRequest, TCollectionRequest } from './collection.js';
import {
  collectionIndex,
  collectionName,
  databaseName,
  indexName,
} from './common.js';

// Index request
export type TIndexNameRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export const IndexListRequest = CollectionRequest;

export type TIndexRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & {
  index: TCollectionIndex[];
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
  index: Joi.array().items(collectionIndex),
});

export const typeDefsCollectionIndex = gql`
  scalar JSON
  scalar Date
  type Query
  type Mutation

  enum ESorting {
    ASC
    DESC
  }

  type CollectionIndex {
    name: String!
    size: Int!
    access: Int!
    since: Date!
    property: String!
  }

  type IndexInput {
    name: String!
    sorting: ESorting!
  }

  extend type Query {
    indexList(
      databaseName: String!
      collectionName: String!
    ): [CollectionIndex]!
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
      index: [IndexInput!]!
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
      args.index
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
