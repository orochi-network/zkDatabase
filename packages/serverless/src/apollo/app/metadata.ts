import { TransactionManager } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { PermissionRecord } from '../../common/permission.js';
import { readMetadata } from '../../domain/use-case/metadata.js';
import {
  changeCollectionOwnership,
  changeDocumentOwnership,
} from '../../domain/use-case/ownership.js';
import { setPermissions } from '../../domain/use-case/permission.js';
import { getSchemaDefinition } from '../../domain/use-case/schema.js';
import { TOwnershipGroup } from '../types/ownership.js';
import { FullPermissionsData, TPermissionGroup } from '../types/permission.js';
import { authorizeWrapper } from '../validation.js';
import { TCollectionRequest } from './collection.js';
import {
  collectionName,
  databaseName,
  objectId,
  permissionDetail,
  userName,
} from './common.js';

const ownershipGroup = Joi.string().valid('User', 'Group').required();

export type TPermissionRequest = TCollectionRequest & {
  docId: string;
};

export type TPermissionSetRequest = TPermissionRequest & {
  grouping: TPermissionGroup;
  permission: Partial<PermissionRecord>;
};

export type TPermissionUpdateRequest = TPermissionRequest & {
  permission: FullPermissionsData;
};

export type TPermissionOwnRequest = TPermissionRequest & {
  grouping: TOwnershipGroup;
  newOwner: string;
};

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
    permission: PermissionDetailInput!
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
    return TransactionManager.withSingleTransaction('service', (session) =>
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
    docId: objectId.optional(),
    permission: permissionDetail.required(),
  }),
  async (_root: unknown, args: TPermissionUpdateRequest, context) => {
    await TransactionManager.withSingleTransaction('service', (session) =>
      setPermissions(
        args.databaseName,
        args.collectionName,
        context.userName,
        args.docId,
        args.permission,
        session
      )
    );

    return TransactionManager.withSingleTransaction('service', (session) =>
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
      await TransactionManager.withSingleTransaction('service', (session) =>
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
      await TransactionManager.withSingleTransaction('service', (session) =>
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

    return TransactionManager.withSingleTransaction('service', (session) =>
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
