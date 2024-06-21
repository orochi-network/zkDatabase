import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { DatabaseEngine, ModelDatabase } from '@zkdb/storage';
import resolverWrapper from '../validation';
import { databaseName, publicKey } from './common';
import { createDatabase } from '../../domain/use-case/database';
import { AppContext } from '../../common/types';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
  publicKey: string
};

export type TFindIndexRequest = TDatabaseRequest & {
  index: number;
};

const DatabaseCreateRequest = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight: Joi.number().integer().positive().required(),
  publicKey
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
  dbCreate(databaseName: String!, merkleHeight: Int!, publicKey: String!): Boolean
  #dbDrop(databaseName: String!): Boolean
}
`;

export const merkleHeight = Joi.number().integer().positive().required();

// Query
const dbStats = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx: AppContext) =>
    ModelDatabase.getInstance(args.databaseName).stats()
);

const dbList = async () =>
  DatabaseEngine.getInstance().client.db().admin().listDatabases();

// Mutation
const dbCreate = resolverWrapper(
  DatabaseCreateRequest,
  async (_root: unknown, args: TDatabaseCreateRequest) =>
    createDatabase(args.databaseName, args.merkleHeight)
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
