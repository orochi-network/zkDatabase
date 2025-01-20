import { Database } from '@domain';
import { config, gql } from '@helper';
import {
  databaseName,
  EContractName,
  merkleHeight,
  pagination,
  TDatabaseCreateRequest,
  TDatabaseCreateResponse,
  TDatabaseExistRequest,
  TDatabaseExistResponse,
  TDatabaseListRequest,
  TDatabaseListResponse,
  TDatabaseRequest,
  TDatabaseResponse,
  TVerificationKeyRequest,
  TVerificationKeyResponse,
  TZkDbVerificationKeyRecord,
} from '@zkdb/common';
import {
  ModelDatabase,
  ModelMetadataDatabase,
  ModelVerificationKey,
  Transaction,
} from '@zkdb/storage';
import Joi from 'joi';
import { Document, ObjectId } from 'mongodb';
import { authorizeWrapper, publicWrapper } from '../validation';

export const typeDefsDatabase = gql`
  #graphql
  type Query
  type Mutation

  enum NetworkId {
    Testnet
    Mainnet
  }

  enum ContractName {
    VkRollup
    VkContract
  }

  type VerificationKeySerialized {
    data: String
    hash: String
  }

  type EnvironmentInfo {
    networkId: NetworkId!
    networkUrl: String!
  }

  type MetadataDatabase {
    databaseName: String!
    databaseOwner: String!
    merkleHeight: Int!
    appPublicKey: String!
    sizeOnDisk: Int
    deployStatus: TransactionStatus!
  }

  type DatabaseListResponse {
    data: [MetadataDatabase]!
    total: Int!
    offset: Int!
  }

  type VerificationKey {
    databaseName: String!
    verificationKeyHash: String!
    verificationKey: VerificationKeySerialized!
    contractName: ContractName!
  }

  type VerificationKeyResponse {
    Contract: VerificationKey!
    Rollup: VerificationKey!
  }

  extend type Query {
    dbList(query: JSON, pagination: PaginationInput): DatabaseListResponse!
    dbStats(databaseName: String!): JSON
    dbInfo(databaseName: String!): MetadataDatabase!
    dbExist(databaseName: String!): Boolean!
    dbVerificationKey(databaseName: String!): JSON
    dbEnvironment: EnvironmentInfo!
  }

  extend type Mutation {
    dbCreate(databaseName: String!, merkleHeight: Int!): Boolean
    dbDeploy(databaseName: String!, appPublicKey: String!): Boolean
  }
`;

// Joi definition

const SchemaDatabaseRecordQuery = Joi.object<TDatabaseListRequest['query']>({
  databaseName: Joi.alternatives().try(
    Joi.string().optional(),
    Joi.object({
      $regex: Joi.string().required(),
      $options: Joi.string().valid('i', 'm', 'g', 's').optional(),
    })
  ),
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

export const JOI_DATABASE_VERIFICATION_KEY =
  Joi.object<TVerificationKeyRequest>({
    databaseName,
  });

// Query
const dbStats = publicWrapper<TDatabaseRequest, Document>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }, _ctx) =>
    // Using system database to get stats
    ModelDatabase.getInstance(databaseName).stats()
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

const dbCreate = authorizeWrapper<
  TDatabaseCreateRequest,
  TDatabaseCreateResponse
>(JOI_DATABASE_CREATE, async (_root, { databaseName, merkleHeight }, ctx) =>
  Transaction.serverless((session) =>
    Database.create(
      { databaseName, merkleHeight, databaseOwner: ctx.userName },
      session
    )
  )
);

const dbExist = publicWrapper<TDatabaseExistRequest, TDatabaseExistResponse>(
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
const dbEnvironment = publicWrapper(async (_root: unknown, _) => {
  return {
    networkId: config.NETWORK_ID,
    networkUrl: config.MINA_URL,
  };
});

// Do we return both VkContract and VkRollup. Or let user choose
const dbVerificationKey = publicWrapper<
  TVerificationKeyRequest,
  TVerificationKeyResponse
>(JOI_DATABASE_VERIFICATION_KEY, async (_root, { databaseName }, _ctx) => {
  const metadataDatabase = await ModelMetadataDatabase.getInstance().findOne({
    databaseName,
  });

  if (!metadataDatabase) {
    throw new Error(`Metadata database ${databaseName} cannot be found`);
  }

  const vkList = await ModelVerificationKey.getInstance()
    .find({
      merkleHeight: metadataDatabase.merkleHeight,
    })
    .toArray();

  if (!vkList) {
    return null;
  }

  const result = vkList.reduce(
    (acc, current) => {
      acc[current.contractName] = current;
      return acc;
    },
    {} as Record<EContractName, TZkDbVerificationKeyRecord>
  );

  // We have a case that empty {}
  return Object.keys(result) ? result : null;
});

export const resolversDatabase = {
  Query: {
    dbStats,
    dbList,
    dbInfo,
    dbExist,
    dbEnvironment,
    dbVerificationKey,
  },
  Mutation: {
    dbCreate,
  },
};
