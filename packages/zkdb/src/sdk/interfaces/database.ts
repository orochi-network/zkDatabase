/* eslint-disable no-unused-vars */
import {
  ETransactionType,
  Schema,
  TDatabaseCreateRequest,
  TGroupRecord,
  TProofStatusDatabaseResponse,
  TRollUpHistoryResponse,
  TSchemaExtendable,
  TTransactionDraftResponse,
  TUser,
  TUserRecord,
  TZkProofResponse,
} from '@zkdb/common';
import { ICollection } from './collection';
import { IGroup } from './group';
import { IUser } from './user';
import { CircuitString, UInt32 } from 'o1js';

export type TDatabaseConfig = Pick<TDatabaseCreateRequest, 'merkleHeight'>;

export interface IDatabase {
  // Database
  create(config: TDatabaseConfig): Promise<boolean>;

  exist(): Promise<boolean>;

  // Collection
  collection<T extends TSchemaExtendable<any>>(
    collectionName: string
  ): ICollection<T>;

  collectionList(): Promise<string[]>;

  // Group
  group(groupName: string): IGroup;

  groupList(): Promise<TGroupRecord[]>;

  // User
  user(
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ): IUser;

  userList(): Promise<TUserRecord[]>;

  // ZK Proof
  proofZk(): Promise<TZkProofResponse>;

  proofStatus(): Promise<TProofStatusDatabaseResponse>;

  // Transaction
  transactionDraft(
    transactionType: ETransactionType
  ): Promise<TTransactionDraftResponse>;

  transactionSubmit(id: string, txHash: string): Promise<boolean>;

  // Rollup
  rollUpStart(): Promise<boolean>;

  rollUpHistory(): Promise<TRollUpHistoryResponse>;
}

const zkdb: IDatabase = {} as any;

zkdb.create({ merkleHeight: 10 });

zkdb.user({ userName: 'test' }).info();

zkdb.collection('users').index.list();

const MySchema = Schema.create({
  name: CircuitString,
  age: UInt32,
});

type TMySchema = typeof MySchema;

zkdb.collection('test').create(MySchema);

const col = zkdb.collection<TMySchema>('test');

col.insert({ name: 'John', age: 30 });

const doc = await zkdb.collection<TMySchema>('test').findOne({ name: 'John' });

const a = await col.metadata.info();

const b = doc?.metadata;

const c = await b?.info();
