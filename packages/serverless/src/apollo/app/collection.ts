import { GROUP_DEFAULT_ADMIN } from '@common';
import { Collection, Metadata } from '@domain';
import { gql } from '@helper';
import {
  collectionName,
  databaseName,
  EIndexType,
  ESortingSchema,
  groupName,
  O1JS_VALID_TYPE,
  PERMISSION_DEFAULT,
  TCollectionCreateRequest,
  TCollectionCreateResponse,
  TCollectionExistRequest,
  TCollectionExistResponse,
  TCollectionIndex,
  TCollectionListRequest,
  TCollectionListResponse,
  TCollectionMetadataRequest,
  TCollectionMetadataResponse,
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
});

export const JOI_COLLECTION_INDEX = Joi.object<TCollectionIndex>({
  // Using pattern for Record<string, EIndexType>
  index: Joi.object()
    .pattern(
      Joi.string().required(),
      Joi.any()
        .valid(...Object.values(EIndexType))
        .required()
    )
    .required(),
  unique: Joi.bool().required(),
});

export const JOI_COLLECTION_CREATE_REQUEST =
  Joi.object<TCollectionCreateRequest>({
    collectionName,
    databaseName,
    group: groupName(false),
    schema: Joi.array().items(schemaField).optional(),
    permission: Joi.number().min(0).max(0xffffff).optional(),
    collectionIndex: Joi.array().items(JOI_COLLECTION_INDEX).optional(),
  });

export const typeDefsCollection = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type CollectionMetadata {
    collectionName: String!
    schema: [SchemaFieldOutput]!
    metadata: OwnershipAndPermission!
    sizeOnDisk: Int
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    collectionList(databaseName: String!): [CollectionMetadata]!

    collectionMetadata(
      databaseName: String!
      collectionName: String!
    ): CollectionMetadata!

    collectionExist(databaseName: String!, collectionName: String!): Boolean!
  }

  extend type Mutation {
    collectionCreate(
      databaseName: String!
      collectionName: String!
      schema: [SchemaFieldInput!]!
      group: String
      permission: Int
    ): Boolean!
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
  async (_root, { databaseName }, ctx) =>
    withTransaction((session) =>
      Collection.list(databaseName, ctx.userName, session)
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
  async (_root, { databaseName, collectionName }) =>
    Collection.exist(databaseName, collectionName)
);

// Mutation
const collectionCreate = authorizeWrapper<
  TCollectionCreateRequest,
  TCollectionCreateResponse
>(
  JOI_COLLECTION_CREATE_REQUEST,
  async (
    _root,
    {
      databaseName,
      collectionName,
      schema,
      group,
      permission,
      collectionIndex,
    },
    ctx
  ) =>
    withTransaction((session) =>
      Collection.create(
        {
          databaseName,
          collectionName,
          actor: ctx.userName,
        },
        schema,
        group || GROUP_DEFAULT_ADMIN,
        permission ? Permission.from(permission) : PERMISSION_DEFAULT,
        collectionIndex,
        session
      )
    )
);

const collectionMetadata = authorizeWrapper<
  TCollectionMetadataRequest,
  TCollectionMetadataResponse
>(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root, { databaseName, collectionName }, ctx) => {
    const collectionMetadata = await Metadata.collection({
      databaseName,
      collectionName,
      actor: ctx.userName,
    });

    if (!collectionMetadata) {
      throw new Error(`Can't find metadata collection: ${collectionName}`);
    }

    return collectionMetadata;
  }
);

export const resolversCollection = {
  JSON: GraphQLJSON,
  Query: {
    collectionList,
    collectionExist,
    collectionMetadata,
  },
  Mutation: {
    collectionCreate,
  },
};
