import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import resolverWrapper from '../validation';
import { DatabaseEngine } from '../../model/abstract/database-engine';
import { ModelDatabase } from '../../model/abstract/database';
import { databaseName } from './common';

export type TDatabaseRequest = {
  databaseName: string;
  merkleHeight: number
};

export type TFindIndexRequest = TDatabaseRequest & {
  index: number;
};

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
  #dbFindIndex(databaseName: String!, index: Int!): JSON
}

extend type Mutation {
  dbCreate(databaseName: String!, merkleHeight: Int!): Boolean
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

// Mutation
const dbCreate = resolverWrapper(
  DatabaseRequest,
  async (_root: unknown, args: TDatabaseRequest) =>
    ModelDatabase.create(args.databaseName, args.merkleHeight)
);

export const resolversDatabase = {
  JSON: GraphQLJSON,
  Query: {
    dbStats,
    dbList,
  },
  Mutation: {
    dbCreate,
  },
};
