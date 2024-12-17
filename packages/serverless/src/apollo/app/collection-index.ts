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
import { Collection } from '@domain';
import { convertToIndexSpecification, gql } from '@helper';
import { authorizeWrapper } from '../validation';

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

const indexExist = authorizeWrapper<TIndexExistRequest, boolean>(
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
const indexCreate = authorizeWrapper<TIndexCreateRequest, boolean>(
  Joi.object({
    databaseName,
    collectionName,
    index: CollectionIndex,
  }),
  async (_root, { databaseName, collectionName, index }, ctx) =>
    Collection.indexCreate(
      {
        databaseName,
        actor: ctx.userName,
        collectionName,
      },
      convertToIndexSpecification(index)
    )
);

const indexDrop = authorizeWrapper<TIndexDropRequest, boolean>(
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
