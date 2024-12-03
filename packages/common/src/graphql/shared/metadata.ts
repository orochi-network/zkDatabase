export const typeCommonDefsMetadata = `#graphql
  scalar JSON
  scalar Date

  input PermissionRecordInput {
    system: Boolean
    create: Boolean
    read: Boolean
    write: Boolean
    delete: Boolean
  }

  input PermissionDetailInput {
    permissionOwner: PermissionRecordInput
    permissionGroup: PermissionRecordInput
    permissionOther: PermissionRecordInput
  }

  type PermissionRecord {
    read: Boolean
    write: Boolean
    delete: Boolean
    create: Boolean
    system: Boolean
  }

  type DocumentMetadataOutput {
    merkleIndex: Int!,
    userName: String!
    groupName: String!
    permissionOwner: PermissionRecord!
    permissionGroup: PermissionRecord!
    permissionOther: PermissionRecord!
  }

  type CollectionMetadataOutput {
    userName: String!
    groupName: String!
    permissionOwner: PermissionRecord!
    permissionGroup: PermissionRecord!
    permissionOther: PermissionRecord!
  }
`;
