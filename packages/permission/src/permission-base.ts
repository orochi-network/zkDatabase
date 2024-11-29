import {
  PermissionRecord,
  PERMISSION_FIELD,
  PERMISSION_ORDER_CREATE,
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

  set create(value: boolean) {
    value
      ? this.bitTurnOn(PERMISSION_ORDER_CREATE)
      : this.bitTurnOff(PERMISSION_ORDER_CREATE);
  }

  get create() {
    return this.getBit(PERMISSION_ORDER_CREATE);
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
      create: this.create,
      delete: this.delete,
      system: this.system,
    };
  }

  combine(permission: PermissionBase): PermissionBase {
    return new PermissionBase(permission.value | this.value);
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

  static permissionReadonly() {
    return PermissionBase.from({ read: true });
  }

  static permissionReadWrite() {
    return PermissionBase.from({
      read: true,
      write: true,
    });
  }
  static permissionReadWriteCreate() {
    return PermissionBase.from({
      read: true,
      write: true,
      create: true,
    });
  }

  static permissionAll() {
    return PermissionBase.from({
      read: true,
      write: true,
      create: true,
      delete: true,
    });
  }

  static permissionAllSystem() {
    return PermissionBase.from({
      read: true,
      write: true,
      create: true,
      delete: true,
      system: true,
    });
  }
}

export default PermissionBase;
