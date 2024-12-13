import {
  SchemaGroupAddUser,
  SchemaGroupCreate,
  SchemaGroupDetail,
  SchemaGroupListAll,
  SchemaGroupListUser,
  SchemaGroupRemoveUser,
  SchemaGroupUpdate,
  TGroupAddUsersRequest,
  TGroupCreateRequest,
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse,
  TGroupListAllRequest,
  TGroupListAllResponse,
  TGroupListByUserRequest,
  TGroupUpdateRequest,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';

import { Group } from '../../domain/use-case/group.js';
import { gql } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { authorizeWrapper, publicWrapper } from '../validation.js';

export const typeDefsGroup = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type GroupUserInfo {
    userName: String!
    updatedAt: String!
    createdAt: String!
  }

  type GroupInfoDetailResponse {
    groupName: String!
    description: String!
    createBy: String!
    updatedAt: String!
    createdAt: String!
    listUser: [GroupUserInfo]!
  }

  type GroupListAllResponse {
    groupName: String!
    description: String!
    createBy: String!
    updatedAt: String!
    createdAt: String!
  }

  extend type Query {
    groupListAll(databaseName: String!): [GroupListAllResponse]!

    groupListByUser(databaseName: String!, userName: String!): [String]

    groupInfoDetail(
      databaseName: String!
      groupName: String!
    ): GroupInfoDetailResponse
  }

  extend type Mutation {
    groupCreate(
      databaseName: String!
      groupName: String!
      groupDescription: String
    ): Boolean

    groupAddUser(
      databaseName: String!
      groupName: String!
      listUser: [String!]!
    ): Boolean

    groupRemoveUser(
      databaseName: String!
      groupName: String!
      listUser: [String!]!
    ): Boolean

    groupUpdate(
      databaseName: String!
      groupName: String!
      newGroupName: String
      newGroupDescription: String
    ): Boolean
  }
`;

// Query
const groupListAll = publicWrapper<TGroupListAllRequest, TGroupListAllResponse>(
  SchemaGroupListAll,
  async (_root, args) => {
    const groups = await new ModelGroup(args.databaseName).find({}).toArray();
    return groups;
  }
);

const groupListByUser = publicWrapper<TGroupListByUserRequest, string[]>(
  SchemaGroupListUser,
  async (_root, args) =>
    new ModelUserGroup(args.databaseName).listGroupByUserName(args.userName)
);

const groupDetail = publicWrapper<
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse
>(SchemaGroupDetail, async (_root, { databaseName, groupName }) =>
  Group.detail({ databaseName, groupName })
);

const groupUpdate = authorizeWrapper<TGroupUpdateRequest, boolean>(
  SchemaGroupUpdate,
  async (_root, args, ctx) => {
    const { databaseName, groupName, newGroupName, newGroupDescription } = args;
    const result = await withTransaction(async (session) => {
      return Group.updateMetadata(
        {
          databaseName,
          groupName,
          newGroupName,
          newGroupDescription,
          createdBy: ctx.userName,
        },
        session
      );
    });

    return result !== null && result;
  }
);

const groupCreate = authorizeWrapper<TGroupCreateRequest, boolean>(
  SchemaGroupCreate,
  async (_root, { databaseName, groupDescription, groupName }, ctx) =>
    Boolean(
      withTransaction((session) =>
        Group.create(
          {
            databaseName,
            groupName,
            groupDescription,
            createdBy: ctx.userName,
          },
          session
        )
      )
    )
);

const groupAddUser = authorizeWrapper<TGroupAddUsersRequest, boolean>(
  SchemaGroupAddUser,
  async (_root, { databaseName, groupName, listUser }, ctx) =>
    Group.addListUser({
      databaseName,
      groupName,
      listUserName: listUser,
      createdBy: ctx.userName,
    })
);

const groupRemoveUser = authorizeWrapper<TGroupAddUsersRequest, boolean>(
  SchemaGroupRemoveUser,
  async (_root: unknown, { databaseName, groupName, listUser }, ctx) =>
    Group.removeListUser({
      databaseName,
      groupName,
      listUserName: listUser,
      createdBy: ctx.userName,
    })
);

export const resolversGroup = {
  JSON: GraphQLJSON,
  Query: {
    groupListAll,
    groupListByUser,
    groupDetail,
  },
  Mutation: {
    groupCreate,
    groupAddUser,
    groupRemoveUser,
    groupUpdate,
  },
};
