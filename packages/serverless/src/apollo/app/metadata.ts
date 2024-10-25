import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import {
  databaseName,
  userName,
  collectionName,
  objectId,
  permissionDetail,
} from './common.js';
import { TCollectionRequest } from './collection.js';
import { PermissionRecord } from '../../common/permission.js';
import { FullPermissionsData, TPermissionGroup } from '../types/permission.js';
import { setPermissions } from '../../domain/use-case/permission.js';
import {
  changeCollectionOwnership,
  changeDocumentOwnership,
} from '../../domain/use-case/ownership.js';
import { TOwnershipGroup } from '../types/ownership.js';
import { readMetadata } from '../../domain/use-case/metadata.js';
import { getSchemaDefinition } from '../../domain/use-case/schema.js';

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

type SchemaField {
  order: Int!
  name: String!
  kind: String!
  indexed: Boolean
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
  ): [SchemaField!]
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

const collectionSchema = publicWrapper(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root: unknown, args: TCollectionRequest, _) =>
    withTransaction((session) =>
      getSchemaDefinition(args.databaseName, args.collectionName, session)
    )
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
    await withTransaction((session) =>
      setPermissions(
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
