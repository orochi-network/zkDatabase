import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import { GraphQLError } from 'graphql';
import resolverWrapper from '../validation.js';
import { databaseName, userName, collectionName, objectId, permissionDetail } from './common.js';
import { TCollectionRequest } from './collection.js';
import { PermissionRecord } from '../../common/permission.js';
import { AppContext } from '../../common/types.js';
import { FullPermissionsData, TPermissionGroup } from '../types/permission.js';
import { setPermissions } from '../../domain/use-case/permission.js';
import {
  changeCollectionOwnership,
  changeDocumentOwnership,
} from '../../domain/use-case/ownership.js';
import { TOwnershipGroup } from '../types/ownership.js';
import { readMetadata } from '../../domain/use-case/metadata.js'
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

input PermissionInput {
  permissionOwner: PermissionInput
  permissionGroup: PermissionInput
  permissionOther: PermissionInput
}

type Metadata {
  merkleIndex: Int!,
  owner: String!
  group: String!
  permissionOwner: PermissionRecord!
  permissionGroup: PermissionRecord!
  permissionOther: PermissionRecord!
}

# If docId is not provided, it will return the permission of the collection
extend type Query {
  permissionList(
    databaseName: String!
    collectionName: String!
    docId: String
  ): Permission

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
    permission: PermissionInput!
  ): Permission!

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
        args.docId,
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

const collectionSchema = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root: unknown, args: TCollectionRequest, _: AppContext) =>
    withTransaction((session) =>
      getSchemaDefinition(args.databaseName, args.collectionName, session)
    )
);

// Mutation
const permissionSet = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    documentPermission: permissionDetail.required(),
  }),
  async (_root: unknown, args: TPermissionUpdateRequest, context: AppContext) => {
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

    const metadata = await withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId,
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

    const metadata = await withTransaction((session) =>
      readMetadata(
        args.databaseName,
        args.collectionName,
        args.docId,
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
    permissionOwn
  },
};
