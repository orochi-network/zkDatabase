import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { DatabaseEngine, ModelDatabase, ModelDbSetting } from '@zkdb/storage';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { databaseName, pagination, publicKey, userName } from './common.js';
import {
  changeDatabaseOwner,
  createDatabase,
  getDatabases,
} from '../../domain/use-case/database.js';
import { Pagination } from '../types/pagination.js';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseSearchRequest = {
  query: { [key: string]: string };
  pagination: Pagination;
};

export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
  publicKey: string;
};

export type TFindIndexRequest = TDatabaseRequest & {
  index: number;
};

export type TDatabaseChangeOwnerRequest = TDatabaseRequest & {
  newOwner: string;
};

const DatabaseCreateRequest = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight: Joi.number().integer().positive().min(8).max(128).required(),
  publicKey,
});

const DatabaseChangeOwnerRequest = Joi.object<TDatabaseChangeOwnerRequest>({
  databaseName,
  newOwner: userName,
});

export const typeDefsDatabase = `#graphql
scalar JSON
type Query
type Mutation

type DbSetting {
  merkleHeight: Int!
  publicKey: String!
}

input PaginationInput {
  limit: Int,
  offset: Int
}

type Collection {
  name: String!
}

type DbDescription {
  databaseName: String!,
  databaseSize: String!,
  merkleHeight: Int!,
  collections: [String]!
}

extend type Query {
  dbList(query: JSON, pagination: PaginationInput): [DbDescription]!
  dbStats(databaseName: String!): JSON
  dbSetting(databaseName: String!): DbSetting!
  #dbFindIndex(databaseName: String!, index: Int!): JSON
}

extend type Mutation {
  dbCreate(databaseName: String!, merkleHeight: Int!, publicKey: String!): Boolean
  dbChangeOwner(databaseName: String!, newOwner: String!): Boolean
  #dbDrop(databaseName: String!): Boolean
}
`;

export const merkleHeight = Joi.number().integer().positive().required();

const databaseSearch = Joi.object({
  query: Joi.object().optional(),
  pagination,
});

// Query
const dbStats = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, _ctx) =>
    ModelDatabase.getInstance(args.databaseName).stats()
);

const dbList = publicWrapper(
  databaseSearch,
  async (_root: unknown, args: TDatabaseSearchRequest, _ctx) =>
    getDatabases(args.query, args.pagination)
);

const dbSetting = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, _ctx) => {
    const databases = await DatabaseEngine.getInstance()
      .client.db()
      .admin()
      .listDatabases();

    const isDatabaseExist = databases.databases.some(
      (db) => db.name === args.databaseName
    );

    if (!isDatabaseExist) {
      throw Error(`Database ${args.databaseName} does not exist`);
    }

    const setting = await ModelDbSetting.getInstance().getSetting(args.databaseName);

    if (setting) {
      return {
        merkleHeight: setting.merkleHeight,
        publicKey: setting.appPublicKey,
      };
    }

    throw Error(`Settings for ${args.databaseName} does not exist`);
  }
);
// Mutation
const dbCreate = authorizeWrapper(
  DatabaseCreateRequest,
  async (_root: unknown, args: TDatabaseCreateRequest, ctx) =>
    createDatabase(
      args.databaseName,
      args.merkleHeight,
      ctx.userName,
      args.publicKey
    )
);

const dbChangeOwner = authorizeWrapper(
  DatabaseChangeOwnerRequest,
  async (_root: unknown, args: TDatabaseChangeOwnerRequest, ctx) =>
    changeDatabaseOwner(args.databaseName, ctx.userName, args.newOwner)
);

type TDatabaseResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    dbStats: typeof dbStats;
    dbList: typeof dbList;
    dbSetting: typeof dbSetting;
  };
  Mutation: {
    dbCreate: typeof dbCreate;
    dbChangeOwner: typeof dbChangeOwner;
  };
};

export const resolversDatabase: TDatabaseResolver = {
  JSON: GraphQLJSON,
  Query: {
    dbStats,
    dbList,
    dbSetting,
  },
  Mutation: {
    dbCreate,
    dbChangeOwner,
  },
};
