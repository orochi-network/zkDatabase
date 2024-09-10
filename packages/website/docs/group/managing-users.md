---
sidebar_position: 3
---

# Managing Users in zkDatabase

In zkDatabase, managing users within a group or database is an essential part of permission and access control. The methods `addUsers` and `removeUsers` allow the database owner or an authorized user to add or remove users from a database or group. These operations help streamline the management of user access and permissions.

## addUsers: Adding Users to Group

The `addUsers` method allows you to add a list of users to a database or group. This is useful for granting users access to specific resources within the zkDatabase.

#### **Syntax**

```ts
await zkdb.database('my-db').fromGroup('group-name').addUsers(userNames);
```

#### **Parameters**

- **`userNames`** (Array of Strings): An array of usernames that you want to add to the database or group. Each username must be a valid, registered user in the system.

#### **Returns**

- A promise that resolves to true if all users were successfully added, or false if the operation failed.

#### **Example**

```ts
const result = await zkdb.database('my-db')
  .fromGroup('group-name')
  .addUsers(['alice', 'bob', 'charlie']);

if (result) {
  console.log('Users successfully added to the database.');
} else {
  console.log('Failed to add users.');
}
```

In this example, the users `alice`, `bob`, and `charlie` are added to the my-db database. The method returns `true` if the operation is successful, or `false` if it fails.

## removeUsers: Removing Users from a Database or Group

The `removeUsers` method allows you to remove a list of users from a database or group. This is useful for revoking access when a user is no longer authorized to interact with the database or group.

#### **Syntax**

```ts
await zkdb.database('my-db').fromGroup('group-name').removeUsers(userNames);
```

#### **Parameters**

- **`userNames`** (Array of Strings): An array of usernames that you want to remove from the database or group.

#### **Returns**

- A promise that resolves to `true` if all users were successfully removed, or `false` if the operation failed.

#### **Example**

```ts
const result = await zkdb.database('my-db')
  .fromGroup('group-name')
  .removeUsers(['alice', 'bob']);
 
if (result) {
  console.log('Users successfully removed from the database.');
} else {
  console.log('Failed to remove users.');
}
```

In this example, the users `alice`, `bob` are removed from the my-db database. The method returns true if the operation is successful, or false if it fails.

## Important Notes

- **Permission Requirements**: Only the database owner or a user with the appropriate permissions can call `addUsers` and `removeUsers` to modify user access. Attempting to call these methods without the proper permissions will result in an error.

- **Error Handling**: Both methods return a promise that resolves to true or false. It is recommended to handle errors or unsuccessful attempts using .catch() or a try...catch block.

- **Batch Operations**: Both `addUsers` and `removeUsers` work with an array of usernames, allowing you to manage multiple users at once for efficiency.

## Use Cases

- **Group Management**: These methods are useful for managing access to specific groups within a database. For example, you can use `addUsers` to grant a group of employees access to a specific resource or `removeUsers` to revoke access from users who are no longer part of a project.

- **Security and Access Control**: By adding and removing users, you can maintain tight control over who can access sensitive data, ensuring that only authorized users have permissions to interact with the database or its contents.

## Summary

The `addUsers` and `removeUsers` methods in zkDatabase provide a simple, effective way to manage user access within a database. With the ability to handle multiple users at once, these methods allow for efficient group and permission management, ensuring that your database remains secure and accessible only to authorized users.

