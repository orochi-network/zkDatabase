import {
  CollectionIndex,
  collectionName,
  databaseName,
  indexName,
  TIndexCreateRequest,
  TIndexDropRequest,
  TIndexExistRequest,
  TIndexListRequest,
  TIndexListResponse,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createIndex,
  doesIndexExist,
  dropIndex,
  listIndexesInfo as listIndexesInfoDomain,
} from '../../domain/use-case/collection.js';
import { convertToIndexSpecification, gql } from '../../helper/common.js';
import { authorizeWrapper } from '../validation.js';
import { CollectionRequest } from './collection.js';

export const typeDefsCollectionIndex = gql`
  scalar JSON
  scalar Date
  type Query
  type Mutation

  type CollectionIndexInfo {
    indexName: String!
    size: Int!
    access: Int!
    property: CollectionIndexProperty!
    createdAt: Date!
  }

  extend type Query {
    indexList(
      databaseName: String!
      collectionName: String!
    ): [CollectionIndexInfo]!

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
      index: JSON!
    ): Boolean

    indexDrop(
      databaseName: String!
      collectionName: String!
      indexName: String!
    ): Boolean
  }
`;

// Query
const indexList = authorizeWrapper<TIndexListRequest, TIndexListResponse>(
  CollectionRequest,
  async (_root, args, ctx) =>
    listIndexesInfoDomain(args.databaseName, ctx.userName, args.collectionName)
);

const indexExist = authorizeWrapper<TIndexExistRequest, boolean>(
  Joi.object({
    databaseName,
    collectionName,
    indexName,
  }),
  async (_root, args, ctx) =>
    doesIndexExist(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexName
    )
);

// Mutation
const indexCreate = authorizeWrapper<TIndexCreateRequest, boolean>(
  Joi.object({
    databaseName,
    collectionName,
    index: CollectionIndex,
  }),
  async (_root, args, ctx) =>
    createIndex(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      convertToIndexSpecification(args.index)
    )
);

const indexDrop = authorizeWrapper<TIndexDropRequest, boolean>(
  Joi.object({
    databaseName,
    collectionName,
    indexName,
  }),
  async (_root, args, ctx) =>
    dropIndex(
      args.databaseName,
      ctx.userName,
      args.collectionName,
      args.indexName
    )
);

export const resolversCollectionIndex = {
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
