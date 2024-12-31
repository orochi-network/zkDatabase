import { Collection } from '@domain';
import { gql } from '@helper';
import {
  collectionName,
  databaseName,
  indexName,
  TIndexCreateRequest,
  TIndexCreateResponse,
  TIndexDropResponse,
  TIndexDropRequest,
  TIndexExistRequest,
  TIndexExistResponse,
  TIndexListRequest,
  TIndexListResponse,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';
import { JOI_COLLECTION_INDEX } from './collection';

export const typeDefsCollectionIndex = gql`
  scalar JSON
  scalar Date
  type Query
  type Mutation

  input CollectionIndex {
    # index: Record<string, EIndexType>;
    index: JSON!
    unique: Boolean!
  }

  type CollectionIndexInfo {
    indexName: String!
    size: Int!
    access: Int!
    property: IndexProperty!
    createdAt: Date!
    index: JSON!
    unique: Boolean!
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
      index: [CollectionIndex!]!
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
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root, { databaseName, collectionName }, ctx) =>
    Collection.indexList({
      databaseName,
      actor: ctx.userName,
      collectionName,
    })
);

const indexExist = authorizeWrapper<TIndexExistRequest, TIndexExistResponse>(
  Joi.object({
    databaseName,
    collectionName,
    indexName,
  }),
  async (_root, { databaseName, collectionName, indexName }, ctx) =>
    Collection.indexExist(
      {
        databaseName,
        actor: ctx.userName,
        collectionName,
      },
      indexName
    )
);

// Mutation
const indexCreate = authorizeWrapper<TIndexCreateRequest, TIndexCreateResponse>(
  Joi.object({
    databaseName,
    collectionName,
    index: Joi.array().items(JOI_COLLECTION_INDEX).required(),
  }),
  async (_root, { databaseName, collectionName, index }, ctx) =>
    Collection.indexCreate(
      {
        databaseName,
        actor: ctx.userName,
        collectionName,
      },
      index
    )
);

const indexDrop = authorizeWrapper<TIndexDropRequest, TIndexDropResponse>(
  Joi.object({
    databaseName,
    collectionName,
    indexName,
  }),
  async (_root, { databaseName, collectionName, indexName }, ctx) =>
    Collection.indexDrop(
      {
        databaseName,
        actor: ctx.userName,
        collectionName,
      },
      indexName
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
