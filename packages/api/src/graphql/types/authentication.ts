import { Session } from "./session.js";
import { Signature } from "./signature.js";
import { User } from "./user.js";

export type SignInInfo = {
  user: User,
  session: Session
  userData: any;
}

export type SignatureProofData = {
  signature: Signature;
  publicKey: string;
  data: string;
};

export type SignUpData = {
  userName: string;
  email: string;
  timestamp: number;
  userData: any;
};
