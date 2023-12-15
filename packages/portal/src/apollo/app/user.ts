import Joi from 'joi';
import {
  IOrderingBy,
  IPagination,
  IRecordList,
} from '@orochi-network/framework';
import GraphQLJSON from 'graphql-type-json';
import GoogleOAuth2Instance from '../../helper/google-client';
import resolverWrapper from '../validation';
import { ModelUser } from '../../model/user';
import { EAccountType, ModelLoginMethod } from '../../model/login_method';
import { ModelProfile } from '../../model/profile';
import UserService from '../../service/user';
import logger from '../../helper/logger';
import { AppContext } from '../../helper/common';
import { revokeAllUserToken, revokeToken } from '../../service/redis';
import { IApiKey, ModelApiKey } from '../../model/api_key';

export const MAX_LIMIT = 20;
export const MAX_OFFSET = 100;

export interface IGoogleLogin {
  token: string;
}

export interface ICreateApiKey {
  name: string;
}

export interface IGetApiKeyList extends IPagination {}

export interface ILogout {
  isSync: boolean;
}

export const queryApiKeys = Joi.object<IGetApiKeyList>({
  limit: Joi.number().integer().positive().max(MAX_LIMIT).default(10),
  offset: Joi.number().integer().positive().max(MAX_OFFSET).default(0),
  order: Joi.array().items(
    Joi.object<IOrderingBy>({
      column: Joi.string().trim(),
      order: Joi.string().trim().valid('asc', 'desc'),
    })
  ),
});

export const mutationGoogleLogin = Joi.object<IGoogleLogin>({
  token: Joi.string().required().trim(),
});

export const mutationLogout = Joi.object<ILogout>({
  isSync: Joi.bool().required(),
});

export const mutationCreateApiKey = Joi.object<ICreateApiKey>({
  name: Joi.string().required().max(200),
});

export const typeDefsUser = `#graphql
  scalar JSON
  type Query
  type Mutation

	input OrderingBy {
    column: String
    order: String
  }

	input Pagination {
    order: [OrderingBy]
    offset: Int
    limit: Int
  }

	type UserAuth {
    uuid: String
    token: String
  }

	type TLogoutResponse {
		success: Boolean!
    message: String
	}

	type TCreateApiKeyResponse {
		name: String!
    key: String!
	}

	type ApiKey {
		name: String!,
		key: String!
	}

	type ApiKeyPagination {
		total: Int!
    records: [ApiKey]!
	}

  extend type Query {
		getApiKeyList(limit: Int, offset: Int, order: [OrderingBy]): ApiKeyPagination
	}

	extend type Mutation {
		googleLogin(token: String): UserAuth
		logout(isSync: Boolean): TLogoutResponse
		createApiKey(name:String!): TCreateApiKeyResponse!
	}
`;

export const resolversUser = {
  JSON: GraphQLJSON,
  Query: {
    getApiKeyList: resolverWrapper(
      queryApiKeys,
      async (_root: unknown, args: IGetApiKeyList, context: AppContext) => {
        try {
          const { userId } = context;
          if (userId) {
            const { limit, offset, order } = args;
            const imModelApiKey = new ModelApiKey();
            const result = await imModelApiKey.getApiKeyList(
              [{ field: 'userId', value: userId }],
              {
                limit,
                offset,
                order,
              }
            );
            const { records, total } = result.result as IRecordList<IApiKey>;
            return {
              total,
              records,
            };
          }
          throw new Error('Unable to get your keys');
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to get your keys');
        }
      }
    ),
  },

  Mutation: {
    createApiKey: resolverWrapper(
      mutationCreateApiKey,
      async (_root: unknown, args: ICreateApiKey, context: AppContext) => {
        try {
          const { userId } = context;
          if (userId) {
            const { name } = args;
            const imModelApiKey = new ModelApiKey();
            const newKey = await imModelApiKey.createApiKey(userId, name);
            return {
              name,
              key: newKey?.key,
            };
          }
          throw new Error('Unable to create api key');
        } catch (error) {
          logger.error(error);
          throw new Error('Unable to create api key');
        }
      }
    ),

    googleLogin: resolverWrapper(
      mutationGoogleLogin,
      async (_: unknown, { token }: { token: string }) => {
        try {
          const ticket = await GoogleOAuth2Instance.verifyIdToken({
            idToken: token,
            // audience: [config.googleLoginId],
          });
          console.log(ticket);

          const payload = ticket.getPayload();
          if (payload && payload.email) {
            const {
              email,
              sub,
              family_name: familyName,
              given_name: givenName,
            } = payload;
            const imUser = new ModelUser();
            const imLoginMethod = new ModelLoginMethod();
            const imProfile = new ModelProfile();

            const oAuthMethod = await imLoginMethod.isLoginOAuthExist(
              sub,
              email
            );
            if (oAuthMethod && oAuthMethod.length > 0) {
              const [user] = await imUser.get([
                { field: 'id', value: oAuthMethod[0].userId },
              ]);
              const googleMethod = oAuthMethod.filter(
                (item) => item.type === EAccountType.google
              );
              if (googleMethod.length > 0) {
                const newToken = await UserService.genUserJwtAndSaveCache(
                  user,
                  email
                );
                return {
                  uuid: user.uuid,
                  token: newToken,
                };
              }

              await imLoginMethod.createOAuthLoginMethod(
                user.id,
                email,
                sub,
                EAccountType.google
              );
              const newToken = await UserService.genUserJwtAndSaveCache(
                user,
                email
              );
              return {
                uuid: user.uuid,
                token: newToken,
              };
            }

            const currentUser = await imUser.isLocalUserExist(email);
            if (currentUser) {
              await imLoginMethod.createOAuthLoginMethod(
                currentUser.id,
                email,
                sub,
                EAccountType.google
              );
              const newToken = await UserService.genUserJwtAndSaveCache(
                currentUser,
                email
              );
              return {
                uuid: currentUser.uuid,
                token: newToken,
              };
            }

            const { user } = await imUser.createOAuthUser(
              email,
              EAccountType.google,
              sub
            );
            await imProfile.updateProfile(user.id, {
              firstName: givenName,
              lastName: familyName,
            });
            const newToken = await UserService.genUserJwtAndSaveCache(
              user,
              email
            );
            return {
              uuid: user.uuid,
              token: newToken,
            };
          }
          throw new Error('Unable to sign you in. Invalid token!');
        } catch (error: any) {
          logger.error(error);
          throw new Error('Unable to sign you in. Invalid token!');
        }
      }
    ),

    logout: resolverWrapper(
      mutationLogout,
      async (_root: unknown, args: ILogout, context: AppContext) => {
        try {
          const { isSync } = args;
          const { userId, token } = context;

          if (userId && token) {
            if (isSync) {
              await revokeAllUserToken(userId);
            } else {
              await revokeToken(userId, token);
            }

            return {
              success: true,
              message: 'Logout successfully',
            };
          }

          throw new Error('User session is invalid. Please try again');
        } catch (e) {
          logger.error(e);
          throw new Error('User session is invalid. Please try again');
        }
      }
    ),
  },
};
