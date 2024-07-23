import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { DatabaseEngine, ModelDatabase } from '@zkdb/storage';
import resolverWrapper from '../validation.js';
import { databaseName, publicKey } from './common.js';
import { createDatabase } from '../../domain/use-case/database.js';
import { AppContext } from '../../common/types.js';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
  publicKey: string;
};

export type TFindIndexRequest = TDatabaseRequest & {
  index: number;
};

const DatabaseCreateRequest = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight: Joi.number().integer().positive().min(8).max(128).required(),
  publicKey,
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
  async (_root: unknown, args: TDatabaseRequest, _ctx: AppContext) =>
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
    createDatabase(args.databaseName, args.merkleHeight, args.publicKey)
);

type TDatabaseResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    dbStats: typeof dbStats;
    dbList: typeof dbList;
  };
  Mutation: {
    dbCreate: typeof dbCreate;
  };
};

export const resolversDatabase: TDatabaseResolver = {
  JSON: GraphQLJSON,
  Query: {
    dbStats,
    dbList,
  },
  Mutation: {
    dbCreate,
  },
};
