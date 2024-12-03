import Joi from 'joi';
import { GraphQLError, GraphQLResolveInfo } from 'graphql';
import { ZKDATABASE_USER_NOBODY } from '../common/const.js';
import { TAuthorizedContext, TPublicContext } from '@zkdb/common';

export type THandler<R, T, C> = (
  _root: R,
  _args: T,
  _context: C,
  _info: GraphQLResolveInfo
) => Promise<any>;

export type TWrapperHandler<R, T, C> = (
  schema: Joi.ObjectSchema<T>,
  resolver: THandler<R, T, C>
) => THandler<R, T, C>;

export type TResolver<T> = {
  [key: string]: any;

  Query: {
    [key: string]: T;
  };

  Mutation: {
    [key: string]: T;
  };
};

export type TOriginResolver<R, T, C> = TResolver<THandler<R, T, C>>;

export type TWrapperMap<T> = TResolver<Joi.ObjectSchema<T>>;

export const publicWrapper = <T, R = any, C = TPublicContext>(
  schema: Joi.ObjectSchema<T>,
  resolver: THandler<R, T, C>
): THandler<R, T, C> => {
  return async (root: R, args: T, context: C, info: GraphQLResolveInfo) => {
    const { error } = schema.validate(args);
    if (error) {
      throw error;
    }
    return resolver(root, args, context, info);
  };
};

export const authorizeWrapper = <T, R = any, C = TAuthorizedContext>(
  schema: Joi.ObjectSchema<T>,
  resolver: THandler<R, T, C>
): THandler<R, T, C> => {
  return async (root: R, args: T, context: C, info: GraphQLResolveInfo) => {
    if ((context as TAuthorizedContext).userName === ZKDATABASE_USER_NOBODY) {
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
};

export const validateDigest = Joi.string()
  .pattern(/^b[a-z,2,3,4,5,6,7]+(|=)+$/i)
  .message('Invalid base32 digest');

export const validateCID = Joi.string()
  .pattern(/^b[a-z,2,3,4,5,6,7]+(|=)+$/i)
  .message('Invalid CID');

export const validateCollection = Joi.string()
  .pattern(/^[a-z][0-9,a-z]{3,64}$/)
  .message('Invalid collection name');

export default publicWrapper;
