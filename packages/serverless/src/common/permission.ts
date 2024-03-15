/* eslint-disable no-bitwise */
export type PermissionRecord = {
  // Permission to change permission and ownership
  system: boolean;
  // Permission to create new record
  create: boolean;
  // Permission to read record
  read: boolean;
  // Permission to write on existing record
  write: boolean;
  // Permission to delete record
  delete: boolean;
};

export const ZKDATABASE_NO_PERMISSION_RECORD = {
  read: false,
  write: false,
  delete: false,
  create: false,
  system: false,
};

export const ZKDATABASE_NO_PERMISSION_BIN = 0;

export type PermissionBasic = {
  owner: string;
  group: string;
  permissionOwner: number;
  permissionGroup: number;
  permissionOther: number;
};

// Transform partial permission to full permission record
export function partialToPermission(
  partial: Partial<PermissionRecord>
): PermissionRecord {
  return {
    ...ZKDATABASE_NO_PERMISSION_RECORD,
    ...partial,
  };
}

// All permission fields
export const ZKDATABASE_ALL_PERMISSION: (keyof PermissionRecord)[] = [
  'system' as keyof PermissionRecord,
  'create' as keyof PermissionRecord,
  'read' as keyof PermissionRecord,
  'write' as keyof PermissionRecord,
  'delete' as keyof PermissionRecord,
];

// Binary form of permission
export class PermissionBinary {
  private permissionBinary: number;

  private permission: PermissionRecord;

  private constructor(permissionRecord: PermissionRecord) {
    this.permission = permissionRecord;
    this.permissionBinary =
      PermissionBinary.toBinaryPermission(permissionRecord);
  }

  set system(value: boolean) {
    this.set('system', value);
  }

  get system(): boolean {
    return this.permission.system;
  }

  set create(value: boolean) {
    this.set('create', value);
  }

  get create(): boolean {
    return this.permission.create;
  }

  set read(value: boolean) {
    this.set('read', value);
  }

  get read(): boolean {
    return this.permission.read;
  }

  set write(value: boolean) {
    this.set('write', value);
  }

  get write(): boolean {
    return this.permission.write;
  }

  set delete(value: boolean) {
    this.set('delete', value);
  }

  get delete(): boolean {
    return this.permission.delete;
  }

  private set(field: keyof PermissionRecord, value: boolean) {
    this.permission[field] = value;
    if (value) {
      this.permissionBinary = PermissionBinary.on(this.permissionBinary, field);
    } else {
      this.permissionBinary = PermissionBinary.off(
        this.permissionBinary,
        field
      );
    }
  }

  private static on(
    binaryPermission: number,
    field: keyof PermissionRecord
  ): number {
    return binaryPermission | (1 << ZKDATABASE_ALL_PERMISSION.indexOf(field));
  }

  private static off(
    binaryPermission: number,
    field: keyof PermissionRecord
  ): number {
    const bit = 1 << ZKDATABASE_ALL_PERMISSION.indexOf(field);
    return (binaryPermission | bit) ^ bit;
  }

  public static toBinaryPermission(permissionRecord: PermissionRecord): number {
    let permission = 0;
    for (let i = 0; i < ZKDATABASE_ALL_PERMISSION.length; i += 1) {
      permission |= permissionRecord[ZKDATABASE_ALL_PERMISSION[i]] ? 1 << i : 0;
    }
    return permission;
  }

  public static fromBinaryPermission(
    permissionBinary: number
  ): PermissionRecord {
    const permission: PermissionRecord = ZKDATABASE_NO_PERMISSION_RECORD;
    for (let i = 0; i < ZKDATABASE_ALL_PERMISSION.length; i += 1) {
      permission[ZKDATABASE_ALL_PERMISSION[i]] =
        (permissionBinary & (1 << i)) !== 0;
    }
    return permission;
  }

  public static fromBinary(number: number): PermissionBinary {
    return new PermissionBinary(PermissionBinary.fromBinaryPermission(number));
  }

  public static fromRecord(
    permissionRecord: PermissionRecord
  ): PermissionBinary {
    return new PermissionBinary(permissionRecord);
  }
}

/**
 * Reducing array of permissions to single permission set
 * @param data Array of permissions
 * @returns
 */
export function reducePermssion(data: PermissionRecord[]) {
  return data.reduce((acc, cur) => {
    const entries = Object.entries(cur);
    for (let i = 0; i < entries.length; i += 1) {
      const [key, value] = entries[i];
      if (value === true) {
        (acc as any)[key] = true;
      }
    }
    return acc;
  });
}
