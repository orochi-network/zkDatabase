import Joi from 'joi';
import { GraphQLError } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { databaseName, username, collectionName, objectId } from './common';
import { TCollectionRequest } from './collection';
import ModelUserGroup from '../../model/user-group';
import ModelPermission from '../../model/permission';
import {
  PermissionBinary,
  PermissionRecord,
  partialToPermission,
} from '../../common/permission';
import { AppContext } from '../../helper/common';

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

input PermissionInput {
  read: Boolean
  write: Boolean
  delete: Boolean
  insert: Boolean
  system: Boolean
}

type PermissionRecord {
  read: Boolean
  write: Boolean
  delete: Boolean
  insert: Boolean
  system: Boolean
}

type Permission {
  username: String
  groupname: String
  userPermission: PermissionRecord
  groupPermission: PermissionRecord
  otherPermission: PermissionRecord
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
    grouping: PermissionGroup!
    permission: PermissionInput!
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
      insert: Joi.boolean(),
      system: Joi.boolean(),
    }),
  }),
  async (_root: unknown, args: TPermissionSetRequest, context: AppContext) => {
    if (
      typeof context.username !== 'undefined' &&
      context.username === 'nobody'
    ) {
      let hasPermission = false;
      const modelPermission = new ModelPermission(args.databaseName);
      const fieldName =
        `${args.grouping.toLowerCase()}Permission` as keyof PermissionRecord;
      // Make user has permission to set permission
      const permission = new ModelPermission(args.databaseName);

      const permissionRecord = await permission.findOne({
        collection: args.collectionName,
        docId: args.docId,
      });
      if (permissionRecord) {
        if (permissionRecord.username === context.username) {
          // If actor has permission to set set hasPermission to true
          if (
            PermissionBinary.fromBinaryPermission(
              permissionRecord.userPermission
            ).system
          ) {
            hasPermission = true;
            // Otherwise check if actor is in the group that has permission to set
          } else {
            const modelUserGroup = new ModelUserGroup(args.databaseName);
            if (
              await modelUserGroup.checkMembership(
                context.username,
                permissionRecord.groupname
              )
            ) {
              if (
                PermissionBinary.fromBinaryPermission(
                  permissionRecord.groupPermission
                ).system
              ) {
                hasPermission = true;
              }
            }
          }
        }

        if (hasPermission) {
          const newPermission = partialToPermission(args.permission);
          if (fieldName === ('otherPermission' as keyof PermissionRecord)) {
            // If set other permission, set system to false
            newPermission.system = false;
          }
          permissionRecord[fieldName] =
            PermissionBinary.toBinaryPermission(newPermission);

          await modelPermission.updateOne(
            { collection: args.collectionName, docId: args.docId },
            {
              [fieldName]: permissionRecord[fieldName],
            }
          );

          return {
            username: permissionRecord.username,
            groupname: permissionRecord.groupname,
            userPermission: PermissionBinary.fromBinaryPermission(
              permissionRecord.userPermission
            ),
            groupPermission: PermissionBinary.fromBinaryPermission(
              permissionRecord.groupPermission
            ),
            otherPermission: PermissionBinary.fromBinaryPermission(
              permissionRecord.otherPermission
            ),
          };
        }
      }
    }
    throw new GraphQLError('Permission denied', {
      extensions: {
        code: 'PERMISSION_DENIED',
      },
    });
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
  async (_root: unknown, args: TPermissionOwnRequest, context: AppContext) => {
    if (
      typeof context.username !== 'undefined' &&
      context.username === 'nobody'
    ) {
      let hasPermission = false;
      const modelPermission = new ModelPermission(args.databaseName);
      // Make user has permission to set permission
      const permission = new ModelPermission(args.databaseName);

      const permissionRecord = await permission.findOne({
        collection: args.collectionName,
        docId: args.docId,
      });
      if (permissionRecord) {
        if (permissionRecord.username === context.username) {
          // If actor has permission to set set hasPermission to true
          if (
            PermissionBinary.fromBinaryPermission(
              permissionRecord.userPermission
            ).system
          ) {
            hasPermission = true;
            // Otherwise check if actor is in the group that has permission to set
          } else {
            const modelUserGroup = new ModelUserGroup(args.databaseName);
            if (
              await modelUserGroup.checkMembership(
                context.username,
                permissionRecord.groupname
              )
            ) {
              if (
                PermissionBinary.fromBinaryPermission(
                  permissionRecord.groupPermission
                ).system
              ) {
                hasPermission = true;
              }
            }
          }
        }

        if (hasPermission) {
          if (args.grouping === 'User') {
            permissionRecord.username = args.newOwner;
            await modelPermission.updateOne(
              { collection: args.collectionName, docId: args.docId },
              {
                username: args.newOwner,
              }
            );
          } else if (args.grouping === 'Group') {
            permissionRecord.groupName = args.newOwner;
            await modelPermission.updateOne(
              { collection: args.collectionName, docId: args.docId },
              {
                groupName: args.newOwner,
              }
            );
          }

          return {
            username: permissionRecord.username,
            groupname: permissionRecord.groupname,
            userPermission: PermissionBinary.fromBinaryPermission(
              permissionRecord.userPermission
            ),
            groupPermission: PermissionBinary.fromBinaryPermission(
              permissionRecord.groupPermission
            ),
            otherPermission: PermissionBinary.fromBinaryPermission(
              permissionRecord.otherPermission
            ),
          };
        }
      }
    }
    throw new GraphQLError('Permission denied', {
      extensions: {
        code: 'PERMISSION_DENIED',
      },
    });
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
