import Joi from 'joi';
import GoogleOAuth2Instance from '../../helper/google-client';
import resolverWrapper from '../validation';
import config from '../../helper/config';
import { ModelUser } from '../../model/user';
import { EAccountType, ModelLoginMethod } from '../../model/login_method';
import { ModelProfile } from '../../model/profile';
import UserService from '../../service/user';
import logger from '../../helper/logger';
import { AppContext } from '../../helper/common';
import { revokeAllUserToken, revokeToken } from '../../service/redis';
import JWTAuthenInstance from '../../helper/jwt';

export interface IGoogleLogin {
  token: string;
}

export interface ILogout {
  isSync: boolean;
}

export const mutationGoogleLogin = Joi.object<IGoogleLogin>({
  token: Joi.string().required().trim(),
});

export const mutationLogout = Joi.object<ILogout>({
  isSync: Joi.bool().required(),
});

export const typeDefsUser = `#graphql
  scalar JSON
  type Query
  type Mutation

	type UserAuth {
    uuid: String
    token: String
  }

	type TLogoutResponse {
		success: Boolean!
    message: String
	}

  extend type Query {}

	extend type Mutation {
		googleLogin(token: String): UserAuth
		logout(isSync: Boolean): TLogoutResponse
	}
`;

export const resolversUser = {
  Mutation: {
    googleLogin: resolverWrapper(
      mutationGoogleLogin,
      async (_: unknown, { token }: { token: string }) => {
        try {
          const ticket = await GoogleOAuth2Instance.verifyIdToken({
            idToken: token,
            audience: [config.googleLoginId],
          });

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
          logger.error(error.message);
          throw new Error('Unable to sign you in. Invalid token!');
        }
      }
    ),

    logout: resolverWrapper(
      mutationLogout,
      async (_root: unknown, args: ILogout, context: AppContext) => {
        try {
          const { isSync } = args;
          const { token } = context;
          if (token) {
            const { uuid } = await JWTAuthenInstance.verifyHeader(token);
            if (uuid) {
              const imUser = new ModelUser();
              const [dbUser] = await imUser.get([
                { field: 'uuid', value: uuid },
              ]);
              if (dbUser) {
                if (isSync) {
                  await revokeAllUserToken(dbUser.id);
                } else {
                  await revokeToken(dbUser.id, token);
                }
              }
              return {
                success: true,
                message: 'Logout successfully',
              };
            }
          }
          throw new Error('User session is invalid. Please try again');
        } catch (e) {
          return { success: false, message: (e as Error).message };
        }
      }
    ),
  },
};
