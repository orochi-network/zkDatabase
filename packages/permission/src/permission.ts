/* eslint-disable no-bitwise */
import { PermissionDetail, PermissionDetailPartial } from './common';
import { PermissionBase } from './permission-base';

export class Permission {
  #owner: PermissionBase = PermissionBase.from(0);
  #group: PermissionBase = PermissionBase.from(0);
  #other: PermissionBase = PermissionBase.from(0);

  private constructor(owner: number, group: number, other: number);
  private constructor(permission: number);

  private constructor(...args: any[]) {
    if (args.length === 1) {
      const permission = args[0];
      this.#owner = PermissionBase.from(permission >> 16);
      this.#group = PermissionBase.from((permission >> 8) & 0xff);
      this.#other = PermissionBase.from(permission & 0xff);
    } else if (args.length === 3) {
      const [owner, group, other] = args;
      this.#owner = PermissionBase.from(owner);
      this.#group = PermissionBase.from(group);
      this.#other = PermissionBase.from(other);
    } else {
      throw new Error('Invalid arguments');
    }
  }

  get owner() {
    return this.#owner;
  }

  get group() {
    return this.#group;
  }

  get other() {
    return this.#other;
  }

  get value() {
    return (
      ((this.#owner.value << 16) |
        (this.#group.value << 8) |
        this.#other.value) &
      0xffffff
    );
  }

  toJSON(): PermissionDetail {
    return {
      owner: this.#owner.toJSON(),
      group: this.#group.toJSON(),
      other: this.#other.toJSON(),
    };
  }

  combine(permission: Permission): Permission {
    return new Permission(permission.value | this.value);
  }

  static from(json: Partial<PermissionDetailPartial>): Permission;

  static from(permission: number): Permission;

  static from(...args: any[]): Permission {
    const param = args[0];
    if (typeof param === 'number') {
      return new Permission(param);
    }
    const jsonParam: Partial<PermissionDetailPartial> = param;
    const permission = new Permission(
      jsonParam.owner ? PermissionBase.from(jsonParam.owner).value : 0,
      jsonParam.group ? PermissionBase.from(jsonParam.group).value : 0,
      jsonParam.other ? PermissionBase.from(jsonParam.other).value : 0
    );
    return permission;
  }

  static policyStrict(): Permission {
    return Permission.from({
      owner: {
        read: true,
        write: true,
        delete: true,
        system: true,
      },
    });
  }

  static policyPrivate(): Permission {
    return Permission.from({
      owner: {
        read: true,
        write: true,
        delete: true,
        system: true,
      },
      group: {
        read: true,
        write: false,
        delete: false,
        system: false,
      },
    });
  }

  static policyPublic(): Permission {
    return Permission.from({
      owner: {
        read: true,
        write: true,
        delete: true,
        system: true,
      },
      group: {
        read: true,
        write: true,
        delete: false,
        system: false,
      },
      other: {
        read: true,
        write: false,
        delete: false,
        system: false,
      },
    });
  }
}

export default Permission;
