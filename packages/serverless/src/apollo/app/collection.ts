import { ModelDatabase, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { O1JS_VALID_TYPE } from '../../common/const.js';
import {
  createCollection,
  createIndex,
  listCollections,
} from '../../domain/use-case/collection.js';
import { TCollectionDetail, TCollectionIndex } from '../../types/index.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import {
  collectionIndex,
  collectionName,
  databaseName,
  groupName,
} from './common.js';
import { TDatabaseRequest } from './database.js';
import { gql } from '../../helper/common.js';

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

export const CollectionCreateRequest = Joi.object<TCollectionCreateRequest>({
  collectionName,
  databaseName,
  groupName: groupName.optional(),
  index: Joi.array().items(collectionIndex.optional()),
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
    listCollections(args.databaseName, ctx.userName)
);

const collectionExist = publicWrapper(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root: unknown, args: TCollectionRequest) =>
    (await ModelDatabase.getInstance(args.databaseName).listCollections()).some(
      (collection) => collection === args.collectionName
    )
);

// Mutation
const collectionCreate = authorizeWrapper(
  CollectionCreateRequest,
  async (_root: unknown, args: TCollectionCreateRequest, ctx) => {
    const createCollectionResult = await withTransaction((session) =>
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

    if (args.index && args.index.length > 0 && createCollectionResult) {
      const indexResult = await createIndex(
        args.databaseName,
        ctx.userName,
        args.collectionName,
        args.index
      );

      if (!indexResult) {
        throw Error('Failed to create index');
      }
    }

    return createCollectionResult;
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
