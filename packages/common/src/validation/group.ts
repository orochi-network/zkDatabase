import Joi from 'joi';
import {
  TGroupAddUsersRequest,
  TGroupCreateRequest,
  TGroupInfoDetailRequest,
  TGroupListAllRequest,
  TGroupListByUserRequest,
  TGroupRemoveUsersRequest,
  TGroupUpdateRequest,
} from '@types';
import {
  databaseName,
  groupDescription,
  groupName,
  userName,
} from '@validation';

// export const SchemaGroupBase =

export const SchemaGroupCreate = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupDescription(false),
});

export const SchemaGroupUpdate = Joi.object<TGroupUpdateRequest>({
  databaseName,
  groupName,
  newGroupName: groupName,
  newGroupDescription: groupDescription(false),
});

export const SchemaGroupDetail = Joi.object<TGroupInfoDetailRequest>({
  databaseName,
  groupName,
});

export const SchemaGroupListUser = Joi.object<TGroupListByUserRequest>({
  databaseName,
  userName,
});

export const SchemaGroupListAll = Joi.object<TGroupListAllRequest>({
  databaseName,
});

export const SchemaGroupAddUser = Joi.object<TGroupAddUsersRequest>({
  databaseName,
  groupName,
  listUser: Joi.array().items(Joi.string().required()).required(),
});

export const SchemaGroupRemoveUser = Joi.object<TGroupRemoveUsersRequest>({
  databaseName,
  groupName,
  listUser: Joi.array().items(Joi.string().required()).required(),
});
