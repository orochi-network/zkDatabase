import {
  TGroupAddUsersRequest,
  TGroupCreateRequest,
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse,
  TGroupListAllRequest,
  TGroupListAllResponse,
  TGroupListByUserRequest,
  TGroupUpdateRequest,
  databaseName,
  groupDescription,
  groupName,
  userName,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  addUsersToGroup,
  changeGroupDescription,
  createGroup,
  excludeUsersToGroup,
  getGroupInfoDetail,
  renameGroup,
} from '../../domain/use-case/group.js';
import { gql } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { authorizeWrapper, publicWrapper } from '../validation.js';

const GroupCreateRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupDescription(false),
});

const GroupDescriptionChangeRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupDescription(false),
});

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
  Joi.object({
    databaseName,
  }),
  async (_root, args) => {
    const groups = await new ModelGroup(args.databaseName).find({}).toArray();
    return groups;
  }
);

const groupListByUser = publicWrapper<TGroupListByUserRequest, string[]>(
  Joi.object({
    databaseName,
    userName,
  }),
  async (_root, args) =>
    new ModelUserGroup(args.databaseName).listGroupByUserName(args.userName)
);

const groupInfoDetail = publicWrapper<
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse
>(
  Joi.object({
    databaseName,
    groupName,
  }),
  async (_root, args) => {
    const group = await getGroupInfoDetail(args.databaseName, args.groupName);
    if (group) {
      return group;
    }
    throw Error(`Group ${args.groupName} does not exist`);
  }
);

const groupUpdate = authorizeWrapper<TGroupUpdateRequest, boolean>(
  Joi.object({
    databaseName,
    groupName,
    newGroupName: groupName,
    newGroupDescription: groupDescription(false),
  }),
  async (_root, args, ctx) => {
    const { databaseName, groupName, newGroupName, newGroupDescription } = args;
    const result = await withTransaction(async (session) => {
      if (newGroupName) {
        if (
          !(await renameGroup(
            databaseName,
            ctx.userName,
            groupName,
            newGroupName,
            session
          ))
        ) {
          throw Error(`Failed to rename group ${groupName} to ${newGroupName}`);
        }
      }
      if (newGroupDescription) {
        if (
          !(await changeGroupDescription(
            databaseName,
            ctx.userName,
            groupName,
            newGroupDescription,
            session
          ))
        ) {
          throw Error(`Failed to change description of group ${groupName}`);
        }
      }
      return true;
    });

    return result !== null && result;
  }
);

const groupCreate = authorizeWrapper<TGroupCreateRequest, boolean>(
  GroupCreateRequest,
  async (_root, args, ctx) =>
    createGroup(
      args.databaseName,
      ctx.userName,
      args.groupName,
      args.groupDescription
    )
);

const groupAddUser = authorizeWrapper<TGroupAddUsersRequest, boolean>(
  Joi.object({
    databaseName,
    groupName,
    listUser: Joi.array().items(Joi.string().required()).required(),
  }),
  async (_root, args, ctx) =>
    addUsersToGroup(
      args.databaseName,
      ctx.userName,
      args.groupName,
      args.listUser
    )
);

const groupRemoveUser = authorizeWrapper<TGroupAddUsersRequest, boolean>(
  Joi.object({
    databaseName,
    groupName,
    listUser: Joi.array().items(Joi.string().required()).required(),
  }),
  async (_root: unknown, args: TGroupAddUsersRequest, ctx) =>
    excludeUsersToGroup(
      args.databaseName,
      ctx.userName,
      args.groupName,
      args.listUser
    )
);

export const resolversGroup = {
  JSON: GraphQLJSON,
  Query: {
    groupListAll,
    groupListByUser,
    groupInfoDetail,
  },
  Mutation: {
    groupCreate,
    groupAddUser,
    groupRemoveUser,
    groupUpdate,
  },
};
