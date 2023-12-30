import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { databaseName, username, collectionName, objectId } from './common';
import { TDatabaseRequest } from './database';
import { TCollectionRequest } from './collection';
import ModelUserGroup from '../../model/user-group';
import ModelPermission from '../../model/permission';
import { PermissionBinary, PermissionRecord } from '../../common/permission';

export type TPermissionRequest = TCollectionRequest & {
  docId?: string;
};

export type TPermissionGroup = 'User' | 'Group' | 'Other';

const permissionGroup = Joi.string().valid('User', 'Group', 'Other').required();

export type TPermissionSetRequest = TPermissionRequest & {
  grouping: TPermissionGroup;
  permission: Partial<PermissionRecord>;
};

export type TPermissionOwnRequest = TPermissionRequest & {
  grouping: TPermissionGroup;
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

input PermissionRecord {
  read: Boolean
  write: Boolean
  delete: Boolean
  insert: Boolean
  system: Boolean
}

type Permission {
  username: String
  userPermission: PermissionRecord
  groupname: String
  groupPermission: PermissionRecord
  otherPermission: PermissionRecord
}

input PermissionSetting {
  grouping: PermissionGroup!
  permission: PermissionRecord
}

# If docId is not provided, it will return the permission of the collection 
extend type Query {
  permissionList(
    databaseName: String!
    collection: String!
    docId: String
  ): Permission
}

extend type Mutation {
  permissionSet(
    databaseName: String!
    collectionName: String!
    docId: String
    newPermission: PermissionSetting!
  ): Permission

  permissionOwn(
    databaseName: String!
    collection: String!
    docId: String
    grouping: PermissionGroup!
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
  async (_root: unknown, args: TPermissionRequest) => {
    const modelPermission = new ModelPermission(args.databaseName);
    const result = await modelPermission.findOne({
      collection: args.collectionName,
      docId: args.docId,
    });

    if (result) {
      return {
        username: result.username,
        groupname: result.groupname,
        userPermission: PermissionBinary.fromBinaryPermission(
          result.userPermission
        ),
        groupPermission: PermissionBinary.fromBinaryPermission(
          result.groupPermission
        ),
        otherPermission: PermissionBinary.fromBinaryPermission(
          result.otherPermission
        ),
      };
    }
    return null;
  }
);

// Mutation
const permissionSet = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    newPermission: Joi.object({
      grouping: permissionGroup,
      permission: Joi.object({
        read: Joi.boolean(),
        write: Joi.boolean(),
        delete: Joi.boolean(),
        insert: Joi.boolean(),
        system: Joi.boolean(),
      }),
    }),
  }),
  async (_root: unknown, args: TPermissionSetRequest) => {
    const modelUserGroup = new ModelPermission(args.databaseName);
  }
);

const permissionOwn = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    grouping: permissionGroup,
    newOwner: username,
  }),
  async (_root: unknown, args: TPermissionOwnRequest) => {
    const modelUserGroup = new ModelUserGroup(args.databaseName);
    const modelPermission = new ModelPermission(args.databaseName);
    const permission = await modelPermission.findOne({
      collection: args.collectionName,
      docId: args.docId,
    });
    if (!permission) {
      throw new Error('Permission not found');
    }
    if (args.grouping === 'User') {
      permission.username = args.newOwner;
    } else if (args.grouping === 'Group') {
      const group = await modelUserGroup.findOne({
        groupName: args.newOwner,
      });
      if (!group) {
        throw new Error('Group not found');
      }
      permission.groupname = args.newOwner;
    } else {
      throw new Error('Invalid grouping');
    }
    await modelPermission.updateOne(
      { collection: args.collectionName, docId: args.docId },
      permission
    );
    return permission;
  }
);

export const resolversGroup = {
  JSON: GraphQLJSON,
  Query: {
    permissionList,
  },
  Mutation: {
    permissionSet,
    permissionOwn,
  },
};
