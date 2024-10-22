import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { DatabaseEngine, ModelDatabase, ModelDbSetting } from '@zkdb/storage';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { databaseName, networkId, pagination, publicKey, userName } from './common.js';
import {
  changeDatabaseOwner,
  createDatabase,
  getDatabases,
} from '../../domain/use-case/database.js';
import { Pagination } from '../types/pagination.js';
import { NetworkId } from '../../domain/types/network.js';

export type TDatabaseRequest = {
  databaseName: string;
  networkId: NetworkId;
};

export type TDatabaseSearchRequest = {
  query: { [key: string]: string };
  pagination: Pagination;
  networkId: NetworkId;
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
  networkId
});

const DatabaseChangeOwnerRequest = Joi.object<TDatabaseChangeOwnerRequest>({
  databaseName,
  newOwner: userName,
  networkId
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
  databaseOwner: String!,
  merkleHeight: Int!,
  collections: [CollectionDescriptionOutput]!,
  networkId: NetworkId!
}

type DatabasePaginationOutput {
  data: [DbDescription]!
  totalSize: Int!
  offset: Int!
}

extend type Query {
  dbList(networkId: NetworkId!, query: JSON, pagination: PaginationInput): DatabasePaginationOutput!
  dbStats(networkId: NetworkId!, databaseName: String!): JSON
  dbSetting(networkId: NetworkId!, databaseName: String!): DbSetting!
  #dbFindIndex(networkId: NetworkId!, databaseName: String!, index: Int!): JSON
}

extend type Mutation {
  dbCreate(networkId: NetworkId!, databaseName: String!, merkleHeight: Int!, publicKey: String!): Boolean
  dbChangeOwner(networkId: NetworkId!, databaseName: String!, newOwner: String!): Boolean
  #dbDrop(databaseName: String!): Boolean
}
`;

export const merkleHeight = Joi.number().integer().positive().required();

const databaseSearch = Joi.object({
  query: Joi.object().optional(),
  pagination,
  networkId
});

// Query
const dbStats = publicWrapper(
  Joi.object({
    databaseName,
    networkId
  }),
  async (_root: unknown, args: TDatabaseRequest, _ctx) =>
    ModelDatabase.getInstance(args.databaseName, args.networkId).stats()
);

const dbList = authorizeWrapper(
  databaseSearch,
  async (_root: unknown, args: TDatabaseSearchRequest, _ctx) =>
    getDatabases(args.networkId, _ctx.userName, args.query, args.pagination)
);

const dbSetting = publicWrapper(
  Joi.object({
    databaseName,
    networkId
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
      args.databaseName,
      args.networkId
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
    createDatabase(
      args.databaseName,
      args.merkleHeight,
      ctx.userName,
      args.publicKey,
      args.networkId
    )
);

const dbChangeOwner = authorizeWrapper(
  DatabaseChangeOwnerRequest,
  async (_root: unknown, args: TDatabaseChangeOwnerRequest, ctx) =>
    changeDatabaseOwner(
      args.databaseName,
      ctx.userName,
      args.newOwner,
      args.networkId
    )
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
