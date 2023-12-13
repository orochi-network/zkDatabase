import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { AppContext } from '../../helper/common';
import { DatabaseEngine } from '../../model/abstract/database-engine';
import { ModelDatabase } from '../../model/database';
import { databaseName, indexNumber } from './common';
import Joi from 'joi';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TFindIndexRequest = TDatabaseRequest & {
  index: number;
};

const FindIndexRequest = Joi.object<TFindIndexRequest>({
  databaseName,
  index: indexNumber,
});

const DatabaseRequest = Joi.object<TDatabaseRequest>({
  databaseName,
});

export const typeDefsDatabase = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  dbList:JSON
  dbStats(databaseName: String!): JSON
  dbFindIndex(databaseName: String!, index: Int!): JSON
}

extend type Mutation {
  dbCreate(databaseName: String!): Boolean
  #dbDrop(databaseName: String!): Boolean
}
`;

// Query
const dbStats = resolverWrapper(
  Joi.object({
    databaseName: Joi.string()
      .trim()
      .min(4)
      .max(128)
      .required()
      .pattern(/^[a-z]+[\_a-z0-9]+/i),
  }),
  async (_root: unknown, args: TDatabaseRequest, _context: AppContext) =>
    ModelDatabase.getInstance(args.databaseName).stats()
);

const dbList = async (_root: unknown, _args: unknown, _context: AppContext) =>
  DatabaseEngine.getInstance().client.db().admin().listDatabases();

const dbFindIndex = resolverWrapper(
  FindIndexRequest,
  async (_root: unknown, args: TFindIndexRequest, _context: AppContext) =>
    ModelDatabase.getInstance(args.databaseName).findIndex(args.index)
);

// Mutation
const dbCreate = resolverWrapper(
  DatabaseRequest,
  async (_root: unknown, args: TDatabaseRequest, _context: AppContext) => {
    await ModelDatabase.getInstance(args.databaseName).create();
    return true;
  }
);

const dbDrop = resolverWrapper(
  DatabaseRequest,
  async (_root: unknown, args: TDatabaseRequest, _context: AppContext) => {
    await ModelDatabase.getInstance(args.databaseName).drop();
    return true;
  }
);

export const resolversDatabase = {
  JSON: GraphQLJSON,
  Query: {
    dbStats,
    dbList,
    dbFindIndex,
  },
  Mutation: {
    dbCreate,
    //dbDrop,
  },
};
