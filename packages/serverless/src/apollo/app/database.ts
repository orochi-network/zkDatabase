import {
  TDatabaseChangeOwnerRequest,
  TDatabaseChangeOwnerResponse,
  TDatabaseCreateRequest,
  TDatabaseCreateResponse,
  TDatabaseExistResponse,
  TDatabaseListRequest,
  TDatabaseListResponse,
  TDatabaseRequest,
  TDatabaseResponse,
  TDatabaseUpdateDeployedRequest,
  TDatabaseUpdateDeployedResponse,
  databaseName,
  merkleHeight,
  pagination,
  publicKey,
  userName,
} from '@zkdb/common';
import {
  ModelDatabase,
  ModelMetadataDatabase,
  withTransaction,
} from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Document, ObjectId } from 'mongodb';
import { Database } from '@domain';
import { config, gql } from '@helper';
import { authorizeWrapper, publicWrapper } from '../validation';

export const typeDefsDatabase = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  enum ENetworkId {
    Testnet
    Mainnet
  }

  type EnvironmentInfo {
    networkId: ENetworkId!
    networkUrl: String!
  }

  type MetadataDatabase {
    databaseName: String!
    databaseOwner: String!
    merkleHeight: Int!
    appPublicKey: String!
    databaseSize: Int
    deployStatus: TransactionStatus!
  }

  type DatabaseListResponse {
    data: [MetadataDatabase]!
    total: Int!
    offset: Int!
  }

  extend type Query {
    dbList(query: JSON, pagination: PaginationInput): DatabaseListResponse!
    dbStats(databaseName: String!): JSON
    dbInfo(databaseName: String!): MetadataDatabase!
    dbExist(databaseName: String!): Boolean!
    dbEnvironment: EnvironmentInfo!
  }

  extend type Mutation {
    dbCreate(databaseName: String!, merkleHeight: Int!): Boolean
    dbTransferOwner(databaseName: String!, newOwner: String!): Boolean
    dbDeploy(databaseName: String!, appPublicKey: String!): Boolean
  }
`;

// Joi definition

const SchemaDatabaseRecordQuery = Joi.object<TDatabaseListRequest['query']>({
  databaseName: Joi.string().optional(),
  databaseOwner: Joi.string().optional(),
  merkleHeight: Joi.number().integer().optional(),
  appPublicKey: Joi.string().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  _id: Joi.custom((value, helpers) => {
    if (!ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }).optional(),
});

export const JOI_DATABASE_LIST = Joi.object<TDatabaseListRequest>({
  query: SchemaDatabaseRecordQuery.optional(),
  pagination,
});

export const JOI_DATABASE_CREATE = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight,
});

export const JOI_DATABASE_UPDATE_DEPLOY =
  Joi.object<TDatabaseUpdateDeployedRequest>({
    databaseName,
    appPublicKey: publicKey,
  });

export const JOI_DATABASE_TRANSFER_OWNER =
  Joi.object<TDatabaseChangeOwnerRequest>({
    databaseName,
    newOwner: userName,
  });

// Query
const dbStats = publicWrapper<TDatabaseRequest, Document>(
  Joi.object({
    databaseName,
  }),
  async (_root, args, _ctx) =>
    // Using system database to get stats
    ModelDatabase.getInstance(args.databaseName).stats()
);

const dbList = authorizeWrapper<TDatabaseListRequest, TDatabaseListResponse>(
  JOI_DATABASE_LIST,
  async (_root, { query, pagination }, _ctx) =>
    Database.listDetail({ filter: query, pagination })
);

const dbInfo = publicWrapper<TDatabaseRequest, TDatabaseResponse>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }, _ctx) => {
    const { db } = new ModelDatabase();
    const { databases } = await db.admin().listDatabases();

    const isDatabaseExist = databases.some((db) => db.name === databaseName);

    if (!isDatabaseExist) {
      throw Error(`Database ${databaseName} does not exist`);
    }

    const database = await ModelMetadataDatabase.getInstance().findOne({
      databaseName,
    });

    if (database) {
      return database;
    }

    throw new Error(`Metadata for ${databaseName} does not exist`);
  }
);

const dbDeploy = authorizeWrapper<
  TDatabaseUpdateDeployedRequest,
  TDatabaseUpdateDeployedResponse
>(
  JOI_DATABASE_UPDATE_DEPLOY,
  async (_root, { databaseName, appPublicKey }, _) =>
    withTransaction((session) =>
      Database.deploy({ databaseName, appPublicKey }, session)
    )
);

const dbCreate = authorizeWrapper<
  TDatabaseCreateRequest,
  TDatabaseCreateResponse
>(JOI_DATABASE_CREATE, async (_root, { databaseName, merkleHeight }, ctx) =>
  Boolean(
    withTransaction((session) =>
      Database.create(
        { databaseName, merkleHeight, databaseOwner: ctx.userName },
        session
      )
    )
  )
);

const dbTransferOwner = authorizeWrapper<
  TDatabaseChangeOwnerRequest,
  TDatabaseChangeOwnerResponse
>(JOI_DATABASE_TRANSFER_OWNER, async (_root, { databaseName, newOwner }, ctx) =>
  Database.transferOwnership({
    databaseName,
    newOwner,
    databaseOwner: ctx.userName,
  })
);

const dbExist = publicWrapper<TDatabaseRequest, TDatabaseExistResponse>(
  Joi.object({
    databaseName,
  }),
  async (_root, args, _ctx) => {
    const { db } = new ModelDatabase();

    const { databases } = await db.admin().listDatabases();

    return databases.some((db) => db.name === args.databaseName);
  }
);

// Query
const dbEnvironment = publicWrapper(
  Joi.object({}),
  async (_root: unknown, _) => {
    return {
      networkId: config.NETWORK_ID,
      networkUrl: config.MINA_URL,
    };
  }
);

export const resolversDatabase = {
  JSON: GraphQLJSON,
  Query: {
    dbStats,
    dbList,
    dbInfo,
    dbExist,
    dbEnvironment,
  },
  Mutation: {
    dbCreate,
    dbTransferOwner,
    dbDeploy,
  },
};
