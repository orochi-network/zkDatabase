import { Collection } from '@domain';
import { gql } from '@helper';
import {
  collectionName,
  databaseName,
  ESortingSchema,
  groupName,
  O1JS_VALID_TYPE,
  TCollectionCreateRequest,
  TCollectionExistRequest,
  TCollectionExistResponse,
  TCollectionListRequest,
  TCollectionListResponse,
} from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper, publicWrapper } from '../validation';

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

  type MetadataCollection {
    collectionName: String!
    schema: [SchemaFieldOutput]!
    metadata: OwnershipAndPermission!
    sizeOnDisk: Int
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    collectionList(databaseName: String!): [MetadataCollection]!

    collectionExist(databaseName: String!, collectionName: String!): Boolean
  }

  extend type Mutation {
    collectionCreate(
      databaseName: String!
      collectionName: String!
      schema: [SchemaFieldInput!]!
      group: String
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
  async (_root, args, ctx) =>
    withTransaction((session) =>
      Collection.list(args.databaseName, ctx.userName, session)
    )
);

const collectionExist = publicWrapper<
  TCollectionExistRequest,
  TCollectionExistResponse
>(
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
        args.permission ? Permission.from(args.permission) : undefined,
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
