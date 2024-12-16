import {
  JOI_DATABASE_CREATE,
  JOI_DATABASE_LIST,
  JOI_DATABASE_TRANSFER_OWNER,
  JOI_DATABASE_UPDATE_DEPLOY,
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
} from '@zkdb/common';
import {
  DATABASE_ENGINE,
  ModelDatabase,
  ModelMetadataDatabase,
  withTransaction,
} from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Document } from 'mongodb';

import { Database } from '../../domain/use-case/database.js';
import { gql } from '../../helper/common.js';
import { authorizeWrapper, publicWrapper } from '../validation.js';

export const typeDefsDatabase = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type Database {
    merkleHeight: Int!
    publicKey: String
    databaseOwner: String!
  }

  input PaginationInput {
    limit: Int
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

  type DatabaseDetail {
    databaseName: String!
    databaseOwner: String!
    merkleHeight: Int!
    appPublicKey: String
    collection: [MetadataCollection]
    databaseSize: Int
    deployStatus: TransactionStatus
  }

  type DatabaseListResponse {
    data: [DatabaseDetail]!
    total: Int!
    offset: Int!
  }

  extend type Query {
    dbList(query: JSON, pagination: PaginationInput): DatabaseListResponse!
    dbStats(databaseName: String!): JSON
    dbInfo(databaseName: String!): Database!
    dbExist(databaseName: String!): Boolean!
  }

  extend type Mutation {
    dbCreate(databaseName: String!, merkleHeight: Int!): Boolean
    dbChangeOwner(databaseName: String!, newOwner: String!): Boolean
    dbDeployedUpdate(databaseName: String!, appPublicKey: String!): Boolean
  }
`;

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
    const { databases } = await DATABASE_ENGINE.serverless.client
      .db()
      .admin()
      .listDatabases();

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

export const resolversDatabase = {
  JSON: GraphQLJSON,
  Query: {
    dbStats,
    dbList,
    dbInfo,
    dbExist,
  },
  Mutation: {
    dbCreate,
    dbTransferOwner,
    dbDeploy,
  },
};
