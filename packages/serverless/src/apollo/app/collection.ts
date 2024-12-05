import {
  TDatabaseRequest,
  TSchemaFieldDefinition,
  collectionName,
  databaseName,
  groupName,
  O1JS_VALID_TYPE,
} from '@zkdb/common';
import { ModelSystemDatabase, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createCollection,
  listCollection,
} from '../../domain/use-case/collection.js';
import { gql } from '../../helper/common.js';
// import { TSchemaFieldDefinition } from '../../types/index.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';

export const schemaField = Joi.object({
  name: Joi.string()
    .pattern(/^[a-z][a-zA-Z0-9_]+$/)
    .required(),
  kind: Joi.string()
    .valid(...O1JS_VALID_TYPE)
    .required(),
  indexed: Joi.boolean().optional(),
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
const collectionList = authorizeWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    listCollection(args.databaseName, ctx.userName)
);

const collectionExist = publicWrapper(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root: unknown, args: TCollectionRequest) =>
    (
      await ModelSystemDatabase.getInstance(args.databaseName).listCollections()
    ).some((collection) => collection === args.collectionName)
);

// Mutation
const collectionCreate = authorizeWrapper(
  CollectionCreateRequest,
  async (_root: unknown, args: TCollectionCreateRequest, ctx) => {
    return withTransaction((session) =>
      createCollection(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.schema,
        args.groupName,
        args.permission,
        session
      )
    );
  }
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
