import {
  collectionName,
  databaseName,
  ESortingSchema,
  groupName,
  O1JS_VALID_TYPE,
  TCollectionCreateRequest,
  TCollectionExistRequest,
  TCollectionListRequest,
  TCollectionListResponse,
} from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Collection } from '../../domain/use-case/collection.js';
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
  sorting: ESortingSchema(true),
});

export const CollectionCreateRequest = Joi.object<TCollectionCreateRequest>({
  collectionName,
  databaseName,
  group: groupName(false),
  schema: Joi.array().items(schemaField).optional(),
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
  async (_root, args, ctx) => Collection.list(args.databaseName, ctx.userName)
);

const collectionExist = publicWrapper<TCollectionExistRequest, boolean>(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root, args) =>
    Collection.exist(args.databaseName, args.collectionName)
);

// Mutation
const collectionCreate = authorizeWrapper<TCollectionCreateRequest, boolean>(
  CollectionCreateRequest,
  async (_root, args, ctx) =>
    withTransaction((session) =>
      Collection.create(
        {
          databaseName: args.databaseName,
          collectionName: args.collectionName,
          actor: ctx.userName,
        },
        args.schema,
        args.group,
        Permission.from(args.permission),
        session
      )
    )
);

export const resolversCollection = {
  JSON: GraphQLJSON,
  Query: {
    collectionList,
    collectionExist,
  },
  Mutation: {
    collectionCreate,
  },
};
