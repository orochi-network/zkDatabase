import { DatabaseEngine, ModelDatabase, ModelDbSetting } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  changeDatabaseOwner,
  createDatabase,
  deployDatabase,
  getDatabases,
  updateDatabaseDeployedStatus,
} from '../../domain/use-case/database.js';
import { Pagination } from '../types/pagination.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { databaseName, pagination, userName } from './common.js';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseSearchRequest = {
  query: { [key: string]: string };
  pagination: Pagination;
};

export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
};

export type TDatabaseDeployRequest = TDatabaseCreateRequest & {
  userPublicKey: string;
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
});

const DatabaseDeployRequest = Joi.object<TDatabaseDeployRequest>({
  databaseName,
  merkleHeight: Joi.number().integer().positive().min(8).max(128).required(),
  userPublicKey: Joi.string()
    .trim()
    .length(55)
    .required()
    .pattern(/^[A-HJ-NP-Za-km-z1-9]{55}$/),
});

const DatabaseChangeOwnerRequest = Joi.object<TDatabaseChangeOwnerRequest>({
  databaseName,
  newOwner: userName,
});

const DatabaseUpdateDeployedStatusRequest = Joi.object<TDatabaseRequest>({
  databaseName,
});

export const typeDefsDatabase = `#graphql
scalar JSON
type Query
type Mutation

type DbSetting {
  merkleHeight: Int!
  publicKey: String!
}

type DbDeployResponse {
  tx: JSON!
  zkAppAddress: String!
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
  databaseOwner: String!,
  deployStatus: String!,
  merkleHeight: Int!,
  collections: [CollectionDescriptionOutput]!
}

type DatabasePaginationOutput {
  data: [DbDescription]!
  totalSize: Int!
  offset: Int!
}

extend type Query {
  dbList(query: JSON, pagination: PaginationInput): DatabasePaginationOutput!
  dbStats(databaseName: String!): JSON
  dbSetting(databaseName: String!): DbSetting!
  #dbFindIndex(databaseName: String!, index: Int!): JSON
}

extend type Mutation {
  dbCreate(databaseName: String!, merkleHeight: Int!): Boolean
  dbChangeOwner(databaseName: String!, newOwner: String!): Boolean
  dbDeploy(databaseName: String!, merkleHeight: Int!, userPublicKey: String!): DbDeployResponse!
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
    const { databases } = await DatabaseEngine.getInstance()
      .client.db()
      .admin()
      .listDatabases();

    const isDatabaseExist = databases.some(
      (db) => db.name === args.databaseName
    );

    if (!isDatabaseExist) {
      throw Error(`Database ${args.databaseName} does not exist`);
    }

    const setting = await ModelDbSetting.getInstance().getSetting(
      args.databaseName
    );

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
    createDatabase(args.databaseName, args.merkleHeight, ctx.userName)
);
const dbDeploy = authorizeWrapper(
  DatabaseDeployRequest,
  async (_root: unknown, args: TDatabaseDeployRequest, ctx) =>
    deployDatabase({ ...args, databaseOwner: ctx.userName })
);
const dbChangeOwner = authorizeWrapper(
  DatabaseChangeOwnerRequest,
  async (_root: unknown, args: TDatabaseChangeOwnerRequest, ctx) =>
    changeDatabaseOwner(args.databaseName, ctx.userName, args.newOwner)
);

const dbUpdateDeployedStatus = authorizeWrapper(
  DatabaseUpdateDeployedStatusRequest,
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    updateDatabaseDeployedStatus(args.databaseName, ctx.userName)
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
    dbDeploy: typeof dbDeploy;
    dbUpdateDeployedStatus: typeof dbUpdateDeployedStatus;
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
    dbUpdateDeployedStatus,
    dbDeploy,
  },
};
