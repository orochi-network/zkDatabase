import type { Request } from 'express';
import type { ObjectId } from 'mongodb';
import { TPagination } from './pagination';

type TDbRecordBasic = {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type TDbRecord<T> = T & TDbRecordBasic;

export type TDbRecordOptional<T> = T & Partial<TDbRecordBasic>;

export type TParamPagination<T> = {
  query?: Partial<T>;
  paginationInput?: TPagination;
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

/**
 * PickAlter type for TypeScript
 * @param T - The type of the object to be altered.
 * @param P - The partial record of properties to be used for alteration.
 * @returns A new type with the specified properties altered.
 */
export type TPickAlter<T, P extends Partial<Record<keyof T, string>>> = {
  [K in keyof P as K extends keyof T
    ? P[K] extends string
      ? P[K]
      : never
    : never]: K extends keyof T ? T[K] : never;
};

export type TNullable<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] | null : T[P];
};

export type TPickOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type TPickNullable<T, K extends keyof T> = Omit<T, K> & TNullable<T, K>;
