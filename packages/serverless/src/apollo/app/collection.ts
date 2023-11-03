import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { AppContext } from '../../helper/common';
import { ModelCollection } from '../../model/collection';
import { DatabaseEngine } from '../../model/abstract/database-engine';
import { databaseName, collectionName, indexField } from './common';
import { TDatabaseRequest } from './database';
import resolverWrapper from '../validation';
import { ModelDatabase } from '../../model/database';
import logger from '../../helper/logger';

export type TCollectionRequest = TDatabaseRequest & {
  collectionName: string;
};

export type TCollectionCreateRequest = TCollectionRequest & {
  indexField?: string[];
};

export const CollectionRequest = Joi.object<TCollectionRequest>({
  collectionName,
  databaseName,
});

export const CollectionCreateRequest = Joi.object<TCollectionCreateRequest>({
  collectionName,
  databaseName,
  indexField,
});

export const typeDefsCollection = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  collectionList(databaseName: String!): JSON
}

extend type Mutation {
  collectionCreate(databaseName: String!, collectionName: String!,  indexField: [String]): Boolean
  collectionDrop(databaseName: String!, collectionName: String!): Boolean
}
`;

// Query
const collectionList = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, _context: AppContext) => ModelDatabase.getInstance(args.databaseName).listCollections()
);

// Mutation
const collectionCreate = resolverWrapper(
  CollectionCreateRequest,
  async (
    _root: unknown,
    args: TCollectionCreateRequest,
    _context: AppContext
  ) => {
    try {
      await ModelCollection.getInstance(
        args.databaseName,
        args.collectionName
      ).create(args.indexField || [])
      return true;
    }
    catch (e) {
      logger.error(e);
      return false;
    }
  }
);

const collectionDrop = resolverWrapper(
  CollectionRequest,
  async (_root: unknown, args: TCollectionRequest, _context: AppContext) => {
    return ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).drop();
  }
);

export const resolversCollection = {
  JSON: GraphQLJSON,
  Query: {
    collectionList,
  },
  Mutation: {
    collectionCreate,
    collectionDrop,
  },
};
