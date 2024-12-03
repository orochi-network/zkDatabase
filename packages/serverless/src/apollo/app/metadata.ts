import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  changeCollectionOwnership,
  changeDocumentOwnership,
} from '../../domain/use-case/ownership.js';
import { setPermission } from '../../domain/use-case/permission.js';
import { getSchemaDefinition } from '../../domain/use-case/schema.js';
import { authorizeWrapper } from '../validation.js';
import { TCollectionRequest } from './collection.js';
import { collectionName, databaseName, objectId, userName } from './common.js';

const ownershipGroup = Joi.string().valid('User', 'Group').required();

export const typeDefsPermission = `#graphql
scalar JSON
type Query
type Mutation

enum PermissionGroup {
  User
  Group
  Other
}

enum OwnershipGroup {
  User
  Group
}

# If docId is not provided, it will return the permission of the collection
extend type Query {
  permissionList(
    databaseName: String!
    collectionName: String!
    docId: String
  ): CollectionMetadataOutput

  collectionSchema(
    databaseName: String!
    collectionName: String!
  ): [SchemaFieldOutput!]
}

extend type Mutation {
  permissionSet(
    databaseName: String!
    collectionName: String!
    docId: String
    permission: Int!
  ): CollectionMetadataOutput!

  permissionOwn(
    databaseName: String!
    collectionName: String!
    docId: String
    grouping: OwnershipGroup!
    newOwner: String!
  ): CollectionMetadataOutput
}

`;

// Query
const permissionList = authorizeWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
  }),
  async (_root: unknown, args: TPermissionRequest, ctx) => {
    return withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId,
        ctx.userName,
        true,
        session
      )
    );
  }
);

const collectionSchema = authorizeWrapper(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root: unknown, args: TCollectionRequest, ctx) =>
    getSchemaDefinition(args.databaseName, args.collectionName, ctx.userName)
);

// Mutation
const permissionSet = authorizeWrapper(
  Joi.object({
    databaseName,
    collectionName,
    permission: Joi.number().min(0).required(),
    docId: objectId.optional(),
  }),
  async (_root: unknown, args: TPermissionUpdateRequest, context) => {
    await withTransaction((session) =>
      setPermission(
        args.databaseName,
        args.collectionName,
        context.userName,
        args.docId,
        args.permission,
        session
      )
    );

    return withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId,
        context.userName,
        true,
        session
      )
    );
  }
);

const permissionOwn = authorizeWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    grouping: ownershipGroup,
    newOwner: userName,
  }),
  async (_root: unknown, args: TPermissionOwnRequest, context) => {
    if (args.docId) {
      await withTransaction((session) =>
        changeDocumentOwnership(
          args.databaseName,
          args.collectionName,
          args.docId,
          context.userName,
          args.grouping,
          args.newOwner,
          session
        )
      );
    } else {
      await withTransaction((session) =>
        changeCollectionOwnership(
          args.databaseName,
          args.collectionName,
          context.userName,
          args.grouping,
          args.newOwner,
          session
        )
      );
    }

    return withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId,
        context.userName,
        true,
        session
      )
    );
  }
);

type TPermissionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    permissionList: typeof permissionList;
    collectionSchema: typeof collectionSchema;
  };
  Mutation: {
    permissionSet: typeof permissionSet;
    permissionOwn: typeof permissionOwn;
  };
};

export const resolversPermission: TPermissionResolver = {
  JSON: GraphQLJSON,
  Query: {
    permissionList,
    collectionSchema,
  },
  Mutation: {
    permissionSet,
    permissionOwn,
  },
};
