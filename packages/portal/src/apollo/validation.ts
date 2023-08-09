import { GraphQLResolveInfo } from 'graphql';
import Joi from 'joi';

const resolverWrapper = (
  schema: Joi.ObjectSchema,
  resolver: (
    _root: any,
    _args: any,
    _context: any,
    _info: GraphQLResolveInfo
  ) => Promise<any>
) => {
  return async (
    root: any,
    args: any,
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
