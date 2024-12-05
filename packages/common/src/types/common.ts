import { Request } from 'express';
import { ObjectId } from 'mongodb';

type TDbRecordBasic = {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type TDbRecord<T> = T & TDbRecordBasic;

export type TDbRecordOptionalM<T> = T & Partial<TDbRecordBasic>;

// We extend express session to define session expiration time
declare module 'express-session' {
  interface SessionData {
    ecdsaChallenge?: string;
  }
}

export type TPublicContext = {
  req: Request;
  sessionId: string;
};

export type TAuthorizedContext = TPublicContext & {
  userName: string;
  email: string;
};

export type TApplicationContext = TPublicContext | TAuthorizedContext;

export type TFakeAuthorizedContext = TAuthorizedContext;
