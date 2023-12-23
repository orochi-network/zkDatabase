import Joi from 'joi';
import { GraphQLResolveInfo } from 'graphql';
import { AppContext } from '../helper/common';

interface IBaseAuthRequest {
  apiKey: string;
}

export type THandler<T = any> = (
  _root: any,
  _args: T,
  _context: any,
  _info: GraphQLResolveInfo
) => Promise<any>;

export type TWrapperHandler<T = any> = (
  schema: Joi.ObjectSchema<T>,
  resolver: THandler<T>
) => THandler<T>;

export type TResolver<T> = {
  [key: string]: any;

  Query: {
    [key: string]: T;
  };

  Mutation: {
    [key: string]: T;
  };
};

export type TOriginResolver<T = any> = TResolver<THandler<T>>;

export type TWrapperMap<T = any> = TResolver<Joi.ObjectSchema<T>>;

export const resolverWrapper = <T>(
  schema: Joi.ObjectSchema<T>,
  resolver: THandler<T>
): THandler<T & IBaseAuthRequest> => {
  return async (
    root: any,
    args: T & IBaseAuthRequest,
    context: any,
    info: GraphQLResolveInfo
  ) => {
    const { error } = schema.validate(args);
    if (error) {
      throw new Error(error.message);
    }
    return resolver(root, args, context, info);
  };
};

export const resolverAuth = (
  schema: Joi.ObjectSchema,
  resolver: (
    _root: any,
    _args: any,
    context: AppContext,
    _info: GraphQLResolveInfo
  ) => Promise<any>
) => {
  return async (
    root: any,
    args: any,
    context: AppContext,
    info: GraphQLResolveInfo
  ) => {
    const { error } = schema.validate(args);
    if (error) {
      throw new Error(error.message);
    }
    // const { token } = context;

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

export default resolverWrapper;
