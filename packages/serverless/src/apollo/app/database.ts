import { DB, ModelDatabase, ModelDbSetting } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  changeDatabaseOwner,
  createDatabase,
  getDatabases,
  updateDeployedDatabase,
} from '../../domain/use-case/database.js';
import { Pagination } from '../types/pagination.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { databaseName, pagination, publicKey, userName } from './common.js';

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseUpdateDeployedRequest = {
  databaseName: string;
  appPublicKey: string;
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
  merkleHeight: Joi.number().integer().positive().min(8).max(256).required(),
  publicKey,
});

const DatabaseUpdateDeployedRequest =
  Joi.object<TDatabaseUpdateDeployedRequest>({
    databaseName,
    appPublicKey: Joi.string()
      .trim()
      .length(55)
      .required()
      .pattern(/^[A-HJ-NP-Za-km-z1-9]{55}$/),
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

type DbDeploy {
  databaseName: String!
  merkleHeight: Int!
  appPublicKey: String!
  tx: String!
}

type DbDescription {
  databaseName: String!,
  databaseSize: String!,
  databaseOwner: String!,
  appPublicKey: String,
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
  dbCreate(databaseName: String!, merkleHeight: Int!, publicKey: String!): Boolean
  dbChangeOwner(databaseName: String!, newOwner: String!): Boolean
  dbDeployedUpdate(databaseName: String!, appPublicKey: String!): Boolean
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

const dbList = authorizeWrapper(
  databaseSearch,
  async (_root: unknown, args: TDatabaseSearchRequest, _ctx) =>
    getDatabases(_ctx.userName, args.query, args.pagination)
);

const dbSetting = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, _ctx) => {
    const { databases } = await DB.service.client.db().admin().listDatabases();

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

const dbDeployedUpdate = authorizeWrapper(
  DatabaseUpdateDeployedRequest,
  async (_root: unknown, args: TDatabaseUpdateDeployedRequest, _) =>
    updateDeployedDatabase(args.databaseName, args.appPublicKey)
);

const dbCreate = authorizeWrapper(
  DatabaseCreateRequest,
  async (_root: unknown, args: TDatabaseCreateRequest, ctx) =>
    createDatabase(args.databaseName, args.merkleHeight, ctx.userName)
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
    dbDeployedUpdate: typeof dbDeployedUpdate;
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
    dbDeployedUpdate,
  },
};
