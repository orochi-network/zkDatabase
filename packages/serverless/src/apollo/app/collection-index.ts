/// <reference types="graphql-type-json/node_modules/graphql" />
import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ModelCollection } from '@zkdb/storage';
import { resolverWrapper } from '../validation';
import { TCollectionRequest, CollectionRequest } from './collection';
import { collectionName, databaseName, indexName, indexField } from './common';

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
  async (_root: unknown, args: TIndexListRequest) =>
    ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).listIndexes()
);

const indexExist = resolverWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest) =>
    ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).isIndexed(args.indexName)
);

// Mutation
const indexCreate = resolverWrapper(
  IndexCreateRequest,
  async (_root: unknown, args: TIndexCreateRequest) =>
    ModelCollection.getInstance(args.databaseName, args.collectionName).index(
      args.indexField || []
    )
);

const indexDrop = resolverWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest) =>
    ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).dropIndex(args.indexName)
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
