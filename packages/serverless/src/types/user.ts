import { TPagination } from './pagination';

export type TUser = {
  userName: string;
  email: string;
  publicKey: string;
};

export type TUserSignature = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: string;
};

export type TSignInRequest = {
  proof: TUserSignature;
};

export type TSignUpRequest = {
  userName: string;
  email: string;
  userData: any;
  timestamp: number;
};

export type TUserFindRequest = {
  query: { [key: string]: string };
  pagination: TPagination;
};
