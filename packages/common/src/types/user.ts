import { TPagination } from './pagination.js';
import { TMinaSignature } from './proof.js';

export type TUser = {
  userName: string;
  email: string;
  publicKey: string;
};

export type TUserSignInRequest = {
  proof: TMinaSignature;
};

export type TUserInfo = {
  userName: string;
  email: string;
  userData: any;
};

export type TUserSignUpInfo = TUserInfo & {
  timestamp: number;
};

export type TUserSignUpRequest = {
  signUp: TUserSignUpInfo;
  proof: TMinaSignature;
};

export type TUserFindRequest = {
  query: { [key: string]: string };
  pagination: TPagination;
};
