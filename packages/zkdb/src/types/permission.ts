import { Schema, ZKDatabaseClient } from '@sdk';
import { PermissionRecord } from '../common/permission';

export type PermissionGroup = 'User' | 'Group' | 'Other';

export type TPermissionOption = {
  write: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
};

/**
 * Permissions policy configuration can either be public, private, strict or custom.
 */
export type Permissions = {
  permissionOwner?: Partial<PermissionRecord>;
  permissionGroup?: Partial<PermissionRecord>;
  permissionOther?: Partial<PermissionRecord>;
};


// Implement builder pattern for pipeline chain style
class PermissionBuilder {
  constructor(private permission: Permissions) {}

  group(permissionGroup: Partial<TPermissionOption>): PermissionBuilder {
    this.permission = {...this.permission, ...permissionGroup}
    return this
  }

  owner(ownerPermissions: Partial<TPermissionOption>) {
    this.permission = { ...this.permission, ...ownerPermissions };
    return this; 
  }

  other(otherPermissions: Partial<TPermissionOption>) {
    this.permission = { ...this.permission, ...otherPermissions };
    return this; 
  }

}

export class AccessPermission {
  private static readonly permissionReadOnly: PermissionRecord = {
    write: false,
    read: true,
    create: false,
    delete: false,
    system: false,
  };

  private static readonly permissionFullSystem: PermissionRecord = {
    write: true,
    read: true,
    create: true,
    delete: true,
    system: true,
  };

  private static readonly permissionNone: PermissionRecord = {
    write: false,
    read: false,
    create: false,
    delete: false,
    system: false,
  };

  private static readonly permissionFull: PermissionRecord = {
    write: true,
    read: true,
    create: true,
    delete: true,
    system: false,
  };

  // Policy
  /**
   * Public permissions allow full access to all entities.
   */
  static readonly policyPublic = new PermissionBuilder ({
    permissionOwner: AccessPermission.permissionFullSystem,
    permissionGroup: AccessPermission.permissionFull,
    permissionOther: AccessPermission.permissionFull,
  });

  /**
   * Private permissions restrict access for others, but allow full control to the owner and group.
   */
  static readonly policyPrivate = new PermissionBuilder( {
    permissionOwner: AccessPermission.permissionFullSystem,
    permissionGroup: AccessPermission.permissionFull,
    permissionOther: AccessPermission.permissionNone,
  })


  /**
   * Strict permissions limit access to the owner only, with no permissions for others or groups.
   */
  static readonly permissionStrict = new PermissionBuilder({
    permissionOwner: AccessPermission.permissionFullSystem,
    permissionGroup: AccessPermission.permissionNone,
    permissionOther: AccessPermission.permissionNone,
  });
}


const zkdb = await ZKDatabaseClient.connect('url')
class Student extends Schema.create({})
await zkdb.db('DB').collection('students').create('group', Student, [], AccessPermission.policyPrivate.group({create: true}))