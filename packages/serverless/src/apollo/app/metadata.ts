import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ObjectId } from 'mongodb';
import { withTransaction } from '@zkdb/storage';
import { GraphQLError } from 'graphql';
import resolverWrapper from '../validation';
import { databaseName, userName, collectionName, objectId } from './common';
import { TCollectionRequest } from './collection';
import { PermissionRecord } from '../../common/permission';
import { AppContext } from '../../common/types';
import { TPermissionGroup } from '../types/permission';
import { changePermissions } from '../../domain/use-case/permission';
import {
  changeCollectionOwnership,
  changeDocumentOwnership,
} from '../../domain/use-case/ownership';
import { TOwnershipGroup } from '../types/ownership';
import { readMetadata } from '../../domain/use-case/metadata';

const permissionGroup = Joi.string().valid('User', 'Group', 'Other').required();

const ownershipGroup = Joi.string().valid('User', 'Group').required();

export type TPermissionRequest = TCollectionRequest & {
  docId: string;
};

export type TPermissionSetRequest = TPermissionRequest & {
  grouping: TPermissionGroup;
  permission: Partial<PermissionRecord>;
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

input PermissionInput {
  read: Boolean
  write: Boolean
  delete: Boolean
  create: Boolean
  system: Boolean
}

type PermissionRecord {
  read: Boolean
  write: Boolean
  delete: Boolean
  create: Boolean
  system: Boolean
}

type Permission {
  userName: String
  groupName: String
  permissionOwner: PermissionRecord
  permissionGroup: PermissionRecord
  permissionOther: PermissionRecord
}

# If docId is not provided, it will return the permission of the collection
extend type Query {
  permissionList(
    databaseName: String!
    collectionName: String!
    docId: String
  ): Permission
}

extend type Mutation {
  permissionSet(
    databaseName: String!
    collectionName: String!
    docId: String
    grouping: PermissionGroup!
    permission: PermissionInput!
  ): Permission

  permissionOwn(
    databaseName: String!
    collectionName: String!
    docId: String
    grouping: OwnershipGroup!
    newOwner: String!
  ): Permission
}

`;

// Query
const permissionList = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
  }),
  async (_root: unknown, args: TPermissionRequest, ctx: AppContext) => {
    const metadata = await withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId ? new ObjectId(args.docId) : null,
        ctx.userName,
        true,
        session
      )
    );

    if (!metadata) {
      const message = args.docId
        ? `document with id ${args.docId}`
        : `collection ${args.collectionName}`;
      throw new GraphQLError(`Metadata for ${message} has not been found`);
    }

    return {
      userName: metadata.owners.owner,
      groupName: metadata.owners.group,
      ...metadata.permissions,
    };
  }
);

// Mutation

// Only owner and group member can perform this action
const permissionSet = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    grouping: permissionGroup,
    permission: Joi.object({
      read: Joi.boolean(),
      write: Joi.boolean(),
      delete: Joi.boolean(),
      create: Joi.boolean(),
      system: Joi.boolean(),
    }),
  }),
  async (_root: unknown, args: TPermissionSetRequest, context: AppContext) => {
    await withTransaction((session) =>
      changePermissions(
        args.databaseName,
        args.collectionName,
        context.userName,
        args.docId ? new ObjectId(args.docId) : null,
        args.grouping,
        args.permission as any,
        session
      )
    );

    const metadata = await withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId ? new ObjectId(args.docId) : null,
        context.userName,
        true,
        session
      )
    );

    if (!metadata) {
      const message = args.docId
        ? `document with id ${args.docId}`
        : `collection ${args.collectionName}`;
      throw new GraphQLError(`Metadata for ${message} has not been found`);
    }

    return {
      userName: metadata.owners.owner,
      groupName: metadata.owners.group,
      ...metadata.permissions,
    };
  }
);

const permissionOwn = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    grouping: ownershipGroup,
    newOwner: userName,
  }),
  async (_root: unknown, args: TPermissionOwnRequest, context: AppContext) => {
    if (args.docId) {
      await withTransaction((session) =>
        changeDocumentOwnership(
          args.databaseName,
          args.collectionName,
          new ObjectId(args.docId),
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

    const metadata = await withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId ? new ObjectId(args.docId) : null,
        context.userName,
        true,
        session
      )
    );

    console.log('metadata', metadata)

    if (!metadata) {
      const message = args.docId
        ? `document with id ${args.docId}`
        : `collection ${args.collectionName}`;
      throw new GraphQLError(`Metadata for ${message} has not been found`);
    }

    return {
      userName: metadata.owners.owner,
      groupName: metadata.owners.group,
      ...metadata.permissions,
    };
  }
);

export const resolversPermission = {
  JSON: GraphQLJSON,
  Query: {
    permissionList,
  },
  Mutation: {
    permissionSet,
    permissionOwn,
  },
};
