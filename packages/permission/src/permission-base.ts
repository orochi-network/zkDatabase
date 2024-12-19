import {
  PermissionRecord,
  PERMISSION_FIELD,
  PERMISSION_ORDER_DELETE,
  PERMISSION_ORDER_READ,
  PERMISSION_ORDER_SYSTEM,
  PERMISSION_ORDER_WRITE,
  PermissionRecordKey,
} from './common';

export class PermissionBase {
  #permission: number;

  private constructor(permission: number) {
    this.#permission = permission;
  }

  private bitTurnOn(bit: number) {
    this.#permission |= 1 << bit;
  }

  private bitTurnOff(bit: number) {
    this.#permission &= ~(1 << bit);
  }

  private getBit(bit: number): boolean {
    return (this.#permission & (1 << bit)) !== 0;
  }

  set write(value: boolean) {
    value
      ? this.bitTurnOn(PERMISSION_ORDER_WRITE)
      : this.bitTurnOff(PERMISSION_ORDER_WRITE);
  }

  get write() {
    return this.getBit(PERMISSION_ORDER_WRITE);
  }

  set read(value: boolean) {
    value
      ? this.bitTurnOn(PERMISSION_ORDER_READ)
      : this.bitTurnOff(PERMISSION_ORDER_READ);
  }

  get read() {
    return this.getBit(PERMISSION_ORDER_READ);
  }

  set delete(value: boolean) {
    value
      ? this.bitTurnOn(PERMISSION_ORDER_DELETE)
      : this.bitTurnOff(PERMISSION_ORDER_DELETE);
  }

  get delete() {
    return this.getBit(PERMISSION_ORDER_DELETE);
  }

  set system(value: boolean) {
    value
      ? this.bitTurnOn(PERMISSION_ORDER_SYSTEM)
      : this.bitTurnOff(PERMISSION_ORDER_SYSTEM);
  }

  get system() {
    return this.getBit(PERMISSION_ORDER_SYSTEM);
  }

  get value() {
    return this.#permission & 0xff;
  }

  toJSON() {
    return {
      write: this.write,
      read: this.read,
      delete: this.delete,
      system: this.system,
    };
  }

  combine(other: PermissionBase): PermissionBase {
    return new PermissionBase(other.value | this.value);
  }

  eq(other: PermissionBase): boolean {
    return this.value === other.value;
  }

  contain(other: PermissionBase): boolean {
    return (this.value & other.value) === other.value;
  }

  static from(json: Partial<PermissionRecord>): PermissionBase;

  static from(permission: number): PermissionBase;

  static from(...args: any[]): PermissionBase {
    const param = args[0];
    if (typeof param === 'number') {
      return new PermissionBase(param);
    }
    const permission = new PermissionBase(0);

    for (const key of PERMISSION_FIELD) {
      if (typeof param[key] === 'boolean') {
        permission[key as PermissionRecordKey] = param[key];
      }
    }
    return permission;
  }

  static permissionNone() {
    return new PermissionBase(0);
  }

  static permissionRead() {
    return PermissionBase.from({ read: true });
  }

  static permissionWrite() {
    return PermissionBase.from({ write: true });
  }

  static permissionDelete() {
    return PermissionBase.from({ delete: true });
  }

  static permissionReadWrite() {
    return PermissionBase.from({
      read: true,
      write: true,
    });
  }

  static permissionReadWriteDelete() {
    return PermissionBase.from({
      read: true,
      write: true,
      delete: true,
    });
  }

  static permissionAll() {
    return PermissionBase.from({
      read: true,
      write: true,
      delete: true,
      system: true,
    });
  }
}

export default PermissionBase;
