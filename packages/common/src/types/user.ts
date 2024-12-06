import { WithoutId } from 'mongodb';
import { TDbRecord } from './common.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { TMinaSignature } from './proof.js';

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

export type TUserSignInResponse = TUser & {
  accessToken: string;
};

export type TUserSignUpInput = Pick<
  TUser,
  'userName' | 'email' | 'publicKey' | 'userData'
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
