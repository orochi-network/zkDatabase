import resolverWrapper from 'apollo/validation.js';
import config from 'helper/config.js';
import GoogleOAuth2Instance from 'helper/google-client.js';
import logger from 'helper/logger.js';
import Joi from 'joi';

export interface IGoogleLogin {
  token: string;
}

export const mutationGoogleLogin = Joi.object<IGoogleLogin>({
  token: Joi.string().required().trim(),
});

export const typeDefsUser = `#graphql
  scalar JSON
  type Query
  type Mutation

	type UserAuth {
    uuid: String
    token: String
  }

  extend type Query {}

	extend type Mutation {
		googleLogin(token: String): UserAuth
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
                const newToken =
                  await UserResolverHelper.genUserJwtAndSaveCache(user, email);
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
              const newToken = await UserResolverHelper.genUserJwtAndSaveCache(
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
              const newToken = await UserResolverHelper.genUserJwtAndSaveCache(
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
            const newToken = await UserResolverHelper.genUserJwtAndSaveCache(
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
  },
};
