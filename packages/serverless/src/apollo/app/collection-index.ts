import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { resolverWrapper } from '../validation';
import {
  TCollectionRequest,
  CollectionRequest,
  TCollectionCreateRequest,
} from './collection';
import { AppContext } from '../../helper/common';
import { collectionName, databaseName, indexName, indexField } from './common';
import { ModelCollection } from '../../model/collection';

// Index request
export type TIndexNameRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export const IndexListRequest = CollectionRequest;

export type TIndexRequest = TCollectionRequest;

export type TIndexCreateRequest = TCollectionCreateRequest;

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

export const typeDefsDatabase = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  indexList(databaseName: String!, collectionName: String!): JSON
  indexExist(databaseName: String!, collectionName: String!, indexName: String): Boolean
}

extend type Mutation {
  indexCreate(databaseName: String!, collectionName: String!, indexField: [String]!): Boolean
  indexDrop(databaseName: String!, collectionName: String!, indexName: String!): Boolean
}
`;

// Query
const indexList = resolverWrapper(
  IndexListRequest,
  async (_root: unknown, args: TIndexListRequest, _context: AppContext) =>
    ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).listIndexes()
);

const indexExist = resolverWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, _context: AppContext) =>
    ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).isIndexed(args.indexName)
);

// Mutation

const indexCreate = resolverWrapper(
  IndexCreateRequest,
  async (_root: unknown, args: TIndexCreateRequest, _context: AppContext) =>
    ModelCollection.getInstance(args.databaseName, args.collectionName).index(
      args.indexField || []
    )
);

const indexDrop = resolverWrapper(
  IndexDetailRequest,
  async (_root: unknown, args: TIndexDetailRequest, _context: AppContext) =>
    ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).dropIndex(args.indexName)
);

export const resolversDatabase = {
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
