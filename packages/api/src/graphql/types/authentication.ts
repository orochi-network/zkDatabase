import { TSession } from "./session.js";
import { TSignature } from "./signature.js";
import { TUser } from "./user.js";

export type TSignInInfo = {
  user: TUser;
  session: TSession;
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
