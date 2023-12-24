import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { v4 as uuidv4 } from 'uuid';
import Client from 'mina-signer';
import resolverWrapper from '../validation';
import ModelUser from '../../model/user';
import { AppContext } from '../../helper/common';
import ModelSession from '../../model/session';

export type TSignInRequest = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: string;
};

export const SignInRequest = Joi.object<TSignInRequest>({
  signature: Joi.object({
    field: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
    scalar: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
  }).required(),
  publicKey: Joi.string()
    .pattern(/^[A-HJ-NP-Za-km-z1-9]*$/)
    .required(),
  data: Joi.string().required(),
});

export type TSignUpRequest = {
  username: string;
  email: string;
  userData: any;
};

export const SignUnRequest = Joi.object<TSignUpRequest>({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  userData: Joi.object(),
});

export type TSignUpWrapper = {
  signUp: TSignUpRequest;
  proof: TSignInRequest;
};

export const SignUpWrapper = Joi.object<TSignUpWrapper>({
  signUp: SignUnRequest.required(),
  proof: SignInRequest.required(),
});

export const typeDefsLogin = `#graphql
scalar JSON
type Query
type Mutation

input Signature {
    field: String
    scalar: String
}

input SignatureProof {
    signature: Signature
    publicKey: String
    data: String
}

input SignUp {
  username: String
  email: String
  userData: JSON
}

type SignUpData {
    success: Boolean
    error: String
    username: String
    email: String
    publicKey: String
}

type SignInResponse {
    success: Boolean
    error: String
    username: String
    sessionKey: String
    sessionId: String
    userData: JSON
}

extend type Query {
  signInData: SignInResponse
}

extend type Mutation {
  signIn(proof: SignatureProof!): SignInResponse
  signOut: Boolean
  signUp(signUp: SignUp!, proof: SignatureProof!): SignUpData
}
`;

// Query
const signInData = async (_root: unknown, _args: any, context: AppContext) => {
  const session = await new ModelSession().findOne({
    sessionId: context.sessionId,
  });
  if (session) {
    const user = await new ModelUser().findOne({
      username: session.username,
    });
    return {
      success: true,
      sessionKey: session.sessionKey,
      sessionId: session.sessionId,
      username: session.username,
      userData: user ? user.userData : null,
    };
  }
  return {
    success: false,
    error: 'Session not found',
  };
};

// Mutation
const signIn = resolverWrapper(
  SignInRequest,
  async (_root: unknown, args: TSignInRequest) => {
    const client = new Client({ network: 'testnet' });

    if (client.verifyMessage(args)) {
      const modelUser = new ModelUser();
      const user = await modelUser.findOne({ publicKey: args.publicKey });
      if (user) {
        const session = await modelUser.signIn(user.username);
        return {
          success: true,
          username: user.username,
          sessionKey: session.sessionKey,
          sessionId: session.sessionId,
          userData: user.userData,
        };
      }
      const username = uuidv4();
      await modelUser.signUp(username, '', args.publicKey, {});
      const session = await modelUser.signIn(username);
      return {
        success: true,
        username,
        sessionKey: session.sessionKey,
        sessionId: session.sessionId,
        userData: null,
      };
    }
    throw new Error('Signature is not valid');
  }
);

const signOut = async (_root: unknown, _args: any, context: AppContext) => {
  if (context.sessionId) {
    await new ModelUser().signOut(context.sessionId);
    return true;
  }
  return false;
};

const signUp = resolverWrapper(
  SignUpWrapper,
  async (_root: unknown, args: TSignUpWrapper) => {
    const client = new Client({ network: 'testnet' });
    if (client.verifyMessage(args.proof)) {
      const modelUser = new ModelUser();
      await modelUser.signUp(
        args.signUp.username,
        args.signUp.email,
        args.proof.publicKey,
        args.signUp.userData
      );
    }
    throw new Error('Signature is not valid');
  }
);

export const resolversLogin = {
  JSON: GraphQLJSON,
  Query: {
    signInData,
  },
  Mutation: {
    signIn,
    signOut,
    signUp,
  },
};
