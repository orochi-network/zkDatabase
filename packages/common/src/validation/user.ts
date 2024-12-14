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

export const JOI_SIGNATURE_PROOF = Joi.object<TMinaSignature>({
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

export const JOI_USER_SIGN_IN = Joi.object<TUserSignInRequest>({
  proof: JOI_SIGNATURE_PROOF.required(),
});

export const JOI_USER_SIGN_UP = Joi.object<TUserSignUpInput>({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  timestamp,
  userData: Joi.object().optional(),
});

export const JOI_SIGN_UP = Joi.object<TUserSignUpRequest>({
  newUser: JOI_USER_SIGN_UP,
  proof: JOI_SIGNATURE_PROOF.required(),
});

export const JOI_USER_FIND = Joi.object<TUserFindRequest>({
  query: Joi.object<TUser>({
    userName,
    email: Joi.string().email(),
    publicKey,
  }),
  pagination,
});
