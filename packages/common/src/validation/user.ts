import {
  TMinaSignature,
  TUser,
  TUserFindRequest,
  TUserSignInRequest,
  TUserSignUpInput,
  TUserSignUpRequest,
} from '@types';
import { pagination, publicKey, timestamp, userName } from '@validation';
import Joi from 'joi';

export const SignatureProof = Joi.object<TMinaSignature>({
  signature: Joi.object({
    field: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
    scalar: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
  }).required(),
  publicKey,
  data: Joi.string().required(),
});

export const SchemaSignIn = Joi.object<TUserSignInRequest>({
  proof: SignatureProof.required(),
});

export const SchemaUserSignUp = Joi.object<TUserSignUpInput>({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  timestamp,
  userData: Joi.object().optional(),
});

export const SchemaSignUp = Joi.object<TUserSignUpRequest>({
  newUser: SchemaUserSignUp,
  proof: SignatureProof.required(),
});

export const SchemaUserFind = Joi.object<TUserFindRequest>({
  query: Joi.object<TUser>({
    userName,
    email: Joi.string().email(),
    publicKey,
  }),
  pagination,
});
