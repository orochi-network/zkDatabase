import { TSignature } from "./signature";

export type TSignInInfo = {
  userName: string;
  email: string;
  publicKey: string;
  accessToken: string;
  userData: any;
};

export type TSignatureProofData = {
  signature: TSignature;
  publicKey: string;
  data: string;
};

export type TSignUpData = {
  userName: string;
  email: string;
  timestamp: number;
  userData: any;
};
