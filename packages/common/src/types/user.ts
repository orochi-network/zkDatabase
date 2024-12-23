import type { WithoutId } from 'mongodb';
import { TDbRecord } from './common.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { TMinaSignature } from './proof.js';

// For model layer
export type TUser = {
  userName: string;
  email: string;
  publicKey: string;
  activated: boolean;
  userData: Record<string, any> | null;
};

export type TUserRecord = TDbRecord<TUser>;

export type TUserSignInRequest = {
  proof: TMinaSignature;
};

// For use-case param

export type TUserParamSignUp = {
  // Remove publicKey from TUser since TMinaSignature already have
  user: Omit<TUser, 'publicKey'>;
  signature: TMinaSignature;
};

// For application layer
export type TUserSignInResponse = TUser & {
  accessToken: string;
};

export type TUserSignUpInput = Pick<
  TUser,
  'userName' | 'email' | 'userData'
> & {
  timestamp: number;
};

export type TUserSignUpRequest = {
  newUser: TUserSignUpInput;
  proof: TMinaSignature;
};

export type TUserSignUpResponse = WithoutId<TUserRecord>;

export type TUserFindRequest = {
  query: { [key: string]: string };
  pagination: TPagination;
};

export type TUserFindResponse = TPaginationReturn<Omit<TUser, 'userData'>[]>;

export type TUserMeRequest = void;

// We need to use pick instead of Omit<TUser, 'activated'>
// Because when we add on some field that need to hide like password
// We will accidentally expose these field
export type TUserMeResponse = Pick<
  TUser,
  'email' | 'publicKey' | 'userData' | 'userName'
>;

// User sign out
export type TUserSignOutRequest = void;

export type TUserSignOutResponse = boolean;

// User ECDSA challenge
export type TUserEcdsaChallengeRequest = void;

export type TUserEcdsaChallengeResponse = string;
