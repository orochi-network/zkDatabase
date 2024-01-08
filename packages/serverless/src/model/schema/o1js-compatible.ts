import { PermissionRecord } from '../../common/permission';

export type TO1DataType =
  | 'UInt32'
  | 'UInt64'
  | 'Int64'
  | 'CircuitString'
  | 'MerkleMapWitness'
  | 'PrivateKey'
  | 'Signature'
  | 'PublicKey'
  | 'Character'
  | 'Sign';

export type TO1Property = Record<TO1DataType, string>;

class O1Schema<T = { [key: string]: TO1Property }> {
  public input: T;

  private constructor(inputSchema: T) {
    this.input = inputSchema;
  }

  public get_input() {
    return this.input;
  }

  public static create<T>(inputSchema: T): Omit<O1Schema<T> & T, 'input'> {
    return new Proxy(new O1Schema<T>(inputSchema), {
      get(target: any, prop: string) {
        return target.input[prop];
      },
      set(target: any, prop: string, newValue: any): boolean {
        // eslint-disable-next-line no-param-reassign
        target.input[prop] = newValue;
        return true;
      },
    });
  }
}

const a = O1Schema.create({
  name: {
    type: 'CircuitString',
    value: 'test',
  },
});

a.name = {
  type: 'CircuitString',
  value: 'test2',
};

console.log(a.name, a);

export type SchemaField = {
  name: string;
  type: TO1DataType;
  value: string;
};

export type SchemaBasic = {
  [key: string]: SchemaField;
};

export type SchemaDocumentIndex<T> = {
  [Property in keyof T as `${string & Property}.name`]: string;
} & {
  [Property in keyof T as `${string & Property}.type`]: TO1DataType;
} & {
  [Property in keyof T as `${string & Property}.value`]: string;
};

export type BasicDoc = {
  username: string;
  password: string;
  email: string;
};

export type SchemaPermission = {
  schema: string[];
  owner: string;
  group: string;
  ownerPermission: PermissionRecord;
  groupPermission: PermissionRecord;
  otherPermission: PermissionRecord;
};

export type SchemaDocument = SchemaBasic & SchemaPermission;
