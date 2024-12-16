import {
  TGroupAddUserListRequest,
  TGroupCreateRequest,
  TGroupInfoDetailRequest,
  TGroupListAllRequest,
  TGroupListByUserRequest,
  TGroupRemoveUserListRequest,
  TGroupUpdateRequest,
} from '@types';
import {
  databaseName,
  groupDescription,
  groupName,
  userName,
} from '@validation';
import Joi from 'joi';

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
