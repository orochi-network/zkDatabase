import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { DatabaseEngine, ModelDatabase, ModelDbSetting } from '@zkdb/storage';
import resolverWrapper from '../validation';
import { databaseName } from './common';
import { createDatabase } from '../../domain/use-case/database';
import { AppContext } from '../../common/types';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
};

export type TFindIndexRequest = TDatabaseRequest & {
  index: number;
};

const DatabaseCreateRequest = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight: Joi.number().integer().positive().required(),
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

export const merkleHeight = Joi.number().integer().positive().required();

// Query
const dbStats = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx: AppContext) =>
    ModelDatabase.getInstance(args.databaseName).stats()
);

const dbList = async () => {
  const databases = await DatabaseEngine.getInstance()
    .client.db()
    .admin()
    .listDatabases();

  return {
    databases: databases.databases.map((database) => ({
      name: database.name,
      size: database.sizeOnDisk,
    })),
    totalSize: databases.totalSize,
    totalSizeMb: databases.totalSizeMb,
  };
};

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
