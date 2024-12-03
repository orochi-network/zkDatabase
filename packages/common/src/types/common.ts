import { Request } from 'express';
import { ObjectId } from 'mongodb';

export type TDbRecord<T> = T & {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

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
