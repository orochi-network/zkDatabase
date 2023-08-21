import Joi from 'joi';
import logger from '../../helper/logger';
import resolverWrapper from '../validation';
import { AppContext } from '../../helper/common';
import KuboInstance from '../../helper/kubo-proxy';
import { TFilesLsArgs, TFilesStatArgs } from '@zkdb/kubo';

export interface IPathExist {
  path: string;
}

export const queryKuboExist = Joi.object<IPathExist>({
  path: Joi.string().trim().required(),
});

export const queryKuboFilels = Joi.object<TFilesLsArgs>({
  path: Joi.string().trim().optional(),
  long: Joi.boolean().optional(),
  U: Joi.boolean().optional(),
});

export const queryKuboFileStat = Joi.object<TFilesStatArgs>({
  'with-local': Joi.boolean().optional(),
  arg: Joi.string().optional(),
  format: Joi.string().optional(),
  hash: Joi.string().optional(),
  size: Joi.string().optional(),
});

export const typeDefsKuboProxy = `#graphql

	type TFilesLsEntry {
		Hash: String
		Name: String
		Size: Int
		Type: Int
	}

  extend type Query {
		kuboExist(path: String): Boolean
		kuboExistFile(path: String): Boolean
		kuboExistDir(path: String): Boolean
		kuboFilesLs(long: Boolean, path: String, U: Boolean): [TFilesLsEntry]
		kuboFilesStat(arg: String, format:String, hash:Boolean, size:Boolean, with-local: Boolean): [TFilesLsEntry]
	}
`;

export const resolversKuboProxy = {
  Query: {
    kuboExist: resolverWrapper(
      queryKuboExist,
      async (_root: unknown, args: IPathExist, _context: AppContext) => {
        try {
          const { path } = args;
          return KuboInstance.exist(path);
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to query your task');
        }
      }
    ),

    kuboExistFile: resolverWrapper(
      queryKuboExist,
      async (_root: unknown, args: IPathExist, _context: AppContext) => {
        try {
          const { path } = args;
          return KuboInstance.existFile(path);
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to query your task');
        }
      }
    ),

    kuboExistDir: resolverWrapper(
      queryKuboExist,
      async (_root: unknown, args: IPathExist, _context: AppContext) => {
        try {
          const { path } = args;
          return KuboInstance.existDir(path);
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to query your task');
        }
      }
    ),

    kuboFilesLs: resolverWrapper(
      queryKuboFilels,
      async (_root: unknown, args: TFilesLsArgs, _context: AppContext) => {
        try {
          return KuboInstance.filesLs(args);
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to query your task');
        }
      }
    ),

    kuboFilesStat: resolverWrapper(
      queryKuboFileStat,
      async (_root: unknown, args: TFilesStatArgs, _context: AppContext) => {
        try {
          return KuboInstance.filesStat(args);
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to query your task');
        }
      }
    ),
  },
};
