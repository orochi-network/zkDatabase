import { Request } from 'express';
import { ObjectId } from 'mongodb';

type TDbRecordBasic = {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type TDbRecord<T> = T & TDbRecordBasic;

export type TDbRecordOptional<T> = T & Partial<TDbRecordBasic>;

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

/**
 * AlterPick type for TypeScript
 * @param T - The type of the object to be altered.
 * @param P - The partial record of properties to be used for alteration.
 * @returns A new type with the specified properties altered.
 */
export type TAlterPick<T, P extends Partial<Record<keyof T, string>>> = {
  [K in keyof P as K extends keyof T
    ? P[K] extends string
      ? P[K]
      : never
    : never]: K extends keyof T ? T[K] : never;
};
