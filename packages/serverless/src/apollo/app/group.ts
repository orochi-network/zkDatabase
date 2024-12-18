import {
  databaseName,
  groupDescription,
  groupName,
  TGroupAddUserListRequest,
  TGroupAddUserListResponse,
  TGroupCreateRequest,
  TGroupCreateResponse,
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse,
  TGroupListAllRequest,
  TGroupListAllResponse,
  TGroupListByUserRequest,
  TGroupListByUserResponse,
  TGroupRemoveUserListRequest,
  TGroupRemoveUserListResponse,
  TGroupUpdateRequest,
  TGroupUpdateResponse,
  userName,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Group } from '@domain';
import { gql } from '@helper';
import { ModelGroup, ModelUserGroup } from '@model';
import { authorizeWrapper, publicWrapper } from '../validation';

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
    groupDescription: String!
    createdBy: String!
    updatedAt: String!
    createdAt: String!
    listUser: [GroupUserInfo]!
  }

  type GroupListAllResponse {
    groupName: String!
    groupDescription: String!
    createdBy: String!
    updatedAt: String!
    createdAt: String!
  }

  extend type Query {
    groupListAll(databaseName: String!): [GroupListAllResponse]!

    groupListByUser(databaseName: String!, userName: String!): [String]

    groupDetail(
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
// Joi validation

export const JOI_GROUP_CREATE = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupDescription(false),
});

export const JOI_GROUP_UPDATE = Joi.object<TGroupUpdateRequest>({
  databaseName,
  groupName,
  newGroupName: groupName(false),
  newGroupDescription: groupDescription(false),
});

export const JOI_GROUP_DETAIL = Joi.object<TGroupInfoDetailRequest>({
  databaseName,
  groupName,
});

export const JOI_GROUP_LIST_USER = Joi.object<TGroupListByUserRequest>({
  databaseName,
  userName,
});

export const JOI_GROUP_LIST_ALL = Joi.object<TGroupListAllRequest>({
  databaseName,
});

export const JOI_GROUP_ADD_USER = Joi.object<TGroupAddUserListRequest>({
  databaseName,
  groupName,
  listUser: Joi.array().items(Joi.string().required()).required(),
});

export const JOI_GROUP_REMOVE_USER = Joi.object<TGroupRemoveUserListRequest>({
  databaseName,
  groupName,
  listUser: Joi.array().items(Joi.string().required()).required(),
});

// Query
const groupListAll = publicWrapper<TGroupListAllRequest, TGroupListAllResponse>(
  JOI_GROUP_LIST_ALL,
  async (_root, args) => {
    const groupList = await new ModelGroup(args.databaseName)
      .find({})
      .toArray();
    return groupList;
  }
);

const groupListByUser = publicWrapper<
  TGroupListByUserRequest,
  TGroupListByUserResponse
>(JOI_GROUP_LIST_USER, async (_root, args) =>
  new ModelUserGroup(args.databaseName).listGroupByUserName(args.userName)
);

const groupDetail = publicWrapper<
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse
>(JOI_GROUP_DETAIL, async (_root, { databaseName, groupName }) =>
  Group.detail({ databaseName, groupName })
);

const groupUpdate = authorizeWrapper<TGroupUpdateRequest, TGroupUpdateResponse>(
  JOI_GROUP_UPDATE,
  async (_root, args, ctx) => {
    const { databaseName, groupName, newGroupName, newGroupDescription } = args;
    const result = await withTransaction(async (session) =>
      Group.updateMetadata(
        {
          databaseName,
          groupName,
          newGroupName,
          newGroupDescription,
          createdBy: ctx.userName,
        },
        session
      )
    );

    return result !== null && result;
  }
);

const groupCreate = authorizeWrapper<TGroupCreateRequest, TGroupCreateResponse>(
  JOI_GROUP_CREATE,
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

const groupAddUser = authorizeWrapper<
  TGroupAddUserListRequest,
  TGroupAddUserListResponse
>(
  JOI_GROUP_ADD_USER,
  async (_root, { databaseName, groupName, listUser }, ctx) =>
    Group.addListUser({
      databaseName,
      groupName,
      listUserName: listUser,
      createdBy: ctx.userName,
    })
);

const groupRemoveUser = authorizeWrapper<
  TGroupRemoveUserListRequest,
  TGroupRemoveUserListResponse
>(
  JOI_GROUP_REMOVE_USER,
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
