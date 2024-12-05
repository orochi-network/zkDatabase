import {
  TCollectionRequest,
  TIndexCreateRequest,
  TIndexListRequest,
  collectionName,
  databaseName,
  indexName,
  IndexSchema,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createIndex,
  doesIndexExist,
  dropIndex,
  listIndexes,
  listIndexesInfo as listIndexesInfoDomain,
} from '../../domain/use-case/collection.js';
import { convertIndexSpecification, gql } from '../../helper/common.js';
import { authorizeWrapper } from '../validation.js';
import { CollectionRequest } from './collection.js';

export const IndexDetailRequest = Joi.object<
  TIndexCreateRequest & TCollectionRequest
>({
  collectionName,
  databaseName,
  indexName,
});

export const IndexCreateRequest = Joi.object<
  TIndexCreateRequest & TCollectionRequest
>({
  collectionName,
  databaseName,
  index: IndexSchema,
});

export const typeDefsCollectionIndex = gql`
  scalar JSON
  scalar Date
  type Query
  type Mutation

  type CollectionIndex {
    name: String!
    size: Int!
    access: Int!
    since: Date!
    property: String!
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
  CollectionRequest,
  async (_root: unknown, args: TIndexListRequest, ctx) =>
    listIndexes(args.databaseName, ctx.userName, args.collectionName)
);

const indexListInfo = authorizeWrapper(
  CollectionRequest,
  async (_root: unknown, args: TIndexListRequest, ctx) =>
    listIndexesInfoDomain(args.databaseName, args.collectionName, ctx.userName)
);

const indexExist = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexCreateRequest & TCollectionRequest, ctx) =>
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
  async (_root: unknown, args: TIndexCreateRequest & TCollectionRequest, ctx) =>
    createIndex(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      convertIndexSpecification(args.index)
    )
);

const indexDrop = authorizeWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexCreateRequest & TCollectionRequest, ctx) =>
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
