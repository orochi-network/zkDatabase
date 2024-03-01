import Joi from 'joi';
import { GraphQLError } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import { ObjectId } from 'mongodb';
import resolverWrapper from '../validation';
import { databaseName, userName, collectionName, objectId } from './common';
import { TCollectionRequest } from './collection';
import ModelUserGroup from '../../model/database/user-group';
import ModelPermission from '../../model/database/document-metadata';
import {
  PermissionBinary,
  PermissionRecord,
  partialToPermission,
} from '../../common/permission';
import { AppContext } from '../../common/types';
import { ZKDATABASE_USER_NOBODY } from '../../common/const';

export type TPermissionRequest = TCollectionRequest & {
  docId: string;
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
    docId: objectId.required(),
  }),
  async (_root: unknown, args: TPermissionRequest) => {
    const modelPermission = new ModelPermission(args.databaseName);
    const result = await modelPermission.findOne({
      collection: args.collectionName,
      docId: new ObjectId(args.docId),
    });

    if (result) {
      return {
        userName: result.userName,
        groupName: result.groupName,
        permissionOwner: PermissionBinary.fromBinaryPermission(
          result.permissionOwner
        ),
        permissionGroup: PermissionBinary.fromBinaryPermission(
          result.permissionGroup
        ),
        permissionOther: PermissionBinary.fromBinaryPermission(
          result.permissionOther
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
    docId: objectId.required(),
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
      typeof context.userName !== 'undefined' &&
      context.userName === ZKDATABASE_USER_NOBODY
    ) {
      let hasPermission = false;
      const modelPermission = new ModelPermission(args.databaseName);
      const fieldName =
        `${args.grouping.toLowerCase()}Permission` as keyof PermissionRecord;
      // Make user has permission to set permission
      const permission = new ModelPermission(args.databaseName);

      const permissionRecord = await permission.findOne({
        collection: args.collectionName,
        docId: new ObjectId(args.docId),
      });
      if (permissionRecord) {
        if (permissionRecord.userName === context.userName) {
          // If actor has permission to set set hasPermission to true
          if (
            PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionOwner
            ).system
          ) {
            hasPermission = true;
            // Otherwise check if actor is in the group that has permission to set
          } else {
            const modelUserGroup = new ModelUserGroup(args.databaseName);
            if (
              await modelUserGroup.checkMembership(
                context.userName,
                permissionRecord.groupName
              )
            ) {
              if (
                PermissionBinary.fromBinaryPermission(
                  permissionRecord.permissionGroup
                ).system
              ) {
                hasPermission = true;
              }
            }
          }
        }

        if (hasPermission) {
          const newPermission = partialToPermission(args.permission);
          if (fieldName === ('permissionOther' as keyof PermissionRecord)) {
            // If set other permission, set system to false
            newPermission.system = false;
          }
          permissionRecord[fieldName] =
            PermissionBinary.toBinaryPermission(newPermission);

          await modelPermission.updateOne(
            {
              collection: args.collectionName,
              docId: new ObjectId(args.docId),
            },
            {
              [fieldName]: permissionRecord[fieldName],
            }
          );

          return {
            userName: permissionRecord.userName,
            groupName: permissionRecord.groupName,
            permissionOwner: PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionOwner
            ),
            permissionGroup: PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionGroup
            ),
            permissionOther: PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionOther
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
    docId: objectId.required(),
    grouping: permissionGroup,
    newOwner: userName,
  }),
  async (_root: unknown, args: TPermissionOwnRequest, context: AppContext) => {
    if (
      typeof context.userName !== 'undefined' &&
      context.userName === ZKDATABASE_USER_NOBODY
    ) {
      let hasPermission = false;
      const modelPermission = new ModelPermission(args.databaseName);
      // Make user has permission to set permission
      const permission = new ModelPermission(args.databaseName);

      const permissionRecord = await permission.findOne({
        collection: args.collectionName,
        docId: new ObjectId(args.docId),
      });
      if (permissionRecord) {
        if (permissionRecord.userName === context.userName) {
          // If actor has permission to set set hasPermission to true
          if (
            PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionOwner
            ).system
          ) {
            hasPermission = true;
            // Otherwise check if actor is in the group that has permission to set
          } else {
            const modelUserGroup = new ModelUserGroup(args.databaseName);
            if (
              await modelUserGroup.checkMembership(
                context.userName,
                permissionRecord.groupName
              )
            ) {
              if (
                PermissionBinary.fromBinaryPermission(
                  permissionRecord.permissionGroup
                ).system
              ) {
                hasPermission = true;
              }
            }
          }
        }

        if (hasPermission) {
          if (args.grouping === 'User') {
            permissionRecord.userName = args.newOwner;
            await modelPermission.updateOne(
              {
                collection: args.collectionName,
                docId: new ObjectId(args.docId),
              },
              {
                userName: args.newOwner,
              }
            );
          } else if (args.grouping === 'Group') {
            permissionRecord.groupName = args.newOwner;
            await modelPermission.updateOne(
              {
                collection: args.collectionName,
                docId: new ObjectId(args.docId),
              },
              {
                groupName: args.newOwner,
              }
            );
          }

          return {
            userName: permissionRecord.userName,
            groupName: permissionRecord.groupName,
            permissionOwner: PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionOwner
            ),
            permissionGroup: PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionGroup
            ),
            permissionOther: PermissionBinary.fromBinaryPermission(
              permissionRecord.permissionOther
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
