import {
  collectionName,
  databaseName,
  ESortingSchema,
  groupName,
  O1JS_VALID_TYPE,
  TCollectionListRequest,
  TCollectionListResponse,
  TDatabaseRequest,
  TSchemaFieldDefinition,
} from '@zkdb/common';
import { ModelDatabase, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createCollection,
  listCollection,
} from '../../domain/use-case/collection.js';
import { gql } from '../../helper/common.js';
import { authorizeWrapper, publicWrapper } from '../validation.js';

export const schemaField = Joi.object({
  name: Joi.string()
    .pattern(/^[a-z][a-zA-Z0-9_]+$/)
    .required(),
  kind: Joi.string()
    .valid(...O1JS_VALID_TYPE)
    .required(),
  index: Joi.boolean().optional(),
  sorting: ESortingSchema,
});

export const schemaFields = Joi.array().items(schemaField);

export type TCollectionRequest = TDatabaseRequest & {
  collectionName: string;
};

export type TCollectionCreateRequest = TCollectionRequest & {
  schema: TSchemaFieldDefinition[];
  permission?: number;
  groupName?: string;
};

export const CollectionRequest = Joi.object<TCollectionRequest>({
  collectionName,
  databaseName,
});

export const CollectionCreateRequest = Joi.object<TCollectionCreateRequest>({
  collectionName,
  databaseName,
  groupName: groupName.optional(),
  schema: schemaFields,
  permission: Joi.number().min(0).max(0xffffff).optional(),
});

export const typeDefsCollection = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  extend type Query {
    collectionList(databaseName: String!): [CollectionDescriptionOutput]!
    collectionExist(databaseName: String!, collectionName: String!): Boolean
  }

  extend type Mutation {
    collectionCreate(
      databaseName: String!
      collectionName: String!
      groupName: String
      schema: [SchemaFieldInput!]!
      permission: Int
    ): Boolean
  }
`;

// Query
const collectionList = authorizeWrapper<
  TCollectionListRequest,
  TCollectionListResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, args, ctx) => listCollection(args.databaseName, ctx.userName)
);

const collectionExist = publicWrapper<TCollectionRequest, boolean>(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root, args) =>
    (await ModelDatabase.getInstance(args.databaseName).listCollections()).some(
      (collection) => collection === args.collectionName
    )
);

// Mutation
const collectionCreate = authorizeWrapper<TCollectionCreateRequest, boolean>(
  CollectionCreateRequest,
  async (_root, args, ctx) =>
    Boolean(
      withTransaction((session) =>
        createCollection(
          args.databaseName,
          args.collectionName,
          ctx.userName,
          args.schema,
          args.groupName,
          args.permission,
          session
        )
      )
    )
);

type TCollectionResolvers = {
  JSON: typeof GraphQLJSON;
  Query: {
    collectionList: typeof collectionList;
    collectionExist: typeof collectionExist;
  };
  Mutation: {
    collectionCreate: typeof collectionCreate;
  };
};

export const resolversCollection: TCollectionResolvers = {
  JSON: GraphQLJSON,
  Query: {
    collectionList,
    collectionExist,
  },
  Mutation: {
    collectionCreate,
  },
};
