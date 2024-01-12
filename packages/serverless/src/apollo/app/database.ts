import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import resolverWrapper from '../validation';
import { DatabaseEngine } from '../../model/abstract/database-engine';
import { ModelDatabase } from '../../model/abstract/database';
import { databaseName, indexNumber } from './common';

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
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) =>
    ModelDatabase.getInstance(args.databaseName).stats()
);

const dbList = async () =>
  DatabaseEngine.getInstance().client.db().admin().listDatabases();

const dbFindIndex = resolverWrapper(
  FindIndexRequest,
  async (_root: unknown, args: TFindIndexRequest) =>
    ModelDatabase.getInstance(args.databaseName).findIndex(args.index)
);

// Mutation
const dbCreate = resolverWrapper(
  DatabaseRequest,
  async (_root: unknown, args: TDatabaseRequest) => {
    await ModelDatabase.getInstance(args.databaseName).create();
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
  },
};
