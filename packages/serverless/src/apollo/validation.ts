import Joi from 'joi';
import { GraphQLError, GraphQLResolveInfo } from 'graphql';
import { TAuthorizedContext, TPublicContext } from '@zkdb/common';
import { ZKDATABASE_USER_NOBODY } from '@common';

export type THandler<Req, Res, R, C> = (
  _root: R,
  _args: Req,
  _context: C,
  _info: GraphQLResolveInfo
) => Promise<Res>;

export type TWrapperHandler<Req, Res, R, C> = (
  schema: Joi.ObjectSchema<Req>,
  resolver: THandler<Req, Res, R, C>
) => THandler<Req, Res, R, C>;

export type TResolver<T> = {
  [key: string]: any;

  Query: {
    [key: string]: T;
  };

  Mutation: {
    [key: string]: T;
  };
};

export type TOriginResolver<Req, Res, R, C> = TResolver<
  THandler<Req, Res, R, C>
>;

export type TWrapperMap<T> = TResolver<Joi.ObjectSchema<T>>;

export function publicWrapper<Req = unknown, Res = any, R = any>(
  resolver: THandler<Req, Res, R, TPublicContext>
): THandler<Req, Res, R, TPublicContext>;

export function publicWrapper<Req = unknown, Res = any, R = any>(
  schema: Joi.ObjectSchema<Req>,
  resolver: THandler<Req, Res, R, TPublicContext>
): THandler<Req, Res, R, TPublicContext>;

// @TODO Remove Res=any to enforcing type
export function publicWrapper<Req = unknown, Res = any, R = any>(
  ...params: any[]
): THandler<Req, Res, R, TPublicContext> {
  if (params.length === 2) {
    const [schema, resolver] = params;
    return async (
      root: R,
      args: Req,
      context: TPublicContext,
      info: GraphQLResolveInfo
    ) => {
      const { error } = schema.validate(args);
      if (error) {
        throw error;
      }
      return resolver(root, args, context, info);
    };
  }
  const [resolver] = params;
  return async (
    root: R,
    args: Req,
    context: TPublicContext,
    info: GraphQLResolveInfo
  ) => {
    return resolver(root, args, context, info);
  };
}

export function authorizeWrapper<Req = unknown, Res = any, R = any>(
  resolver: THandler<Req, Res, R, TAuthorizedContext>
): THandler<Req, Res, R, TAuthorizedContext>;

export function authorizeWrapper<Req = unknown, Res = any, R = any>(
  schema: Joi.ObjectSchema<Req>,
  resolver: THandler<Req, Res, R, TAuthorizedContext>
): THandler<Req, Res, R, TAuthorizedContext>;

export function authorizeWrapper<Req = unknown, Res = any, R = any>(
  ...params: any[]
): THandler<Req, Res, R, TAuthorizedContext> {
  if (params.length === 2) {
    const [schema, resolver] = params;
    return async (
      root: R,
      args: Req,
      context: TAuthorizedContext,
      info: GraphQLResolveInfo
    ) => {
      if (
        typeof context?.userName !== 'string' ||
        typeof context?.email !== 'string' ||
        context.userName === ZKDATABASE_USER_NOBODY
      ) {
        throw new GraphQLError('This method required authorized user', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }
      const { error } = schema.validate(args);
      if (error) {
        throw error;
      }
      return resolver(root, args, context, info);
    };
  }
  const [resolver] = params;
  return async (
    root: R,
    args: Req,
    context: TAuthorizedContext,
    info: GraphQLResolveInfo
  ) => {
    return resolver(root, args, context, info);
  };
}
