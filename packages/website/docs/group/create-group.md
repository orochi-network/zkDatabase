---
sidebar_position: 1
---

# Create Group

zkDatabase allows you to manage user groups within a database, enabling fine-grained access control and permission management. The `createGroup` method allows you to create a new group within a specified database. **Note: Only the database owner has the permission to create a group.**

## Creating a Group: createGroup Method

The `createGroup` method is used to create a new group in a database. Groups are useful for managing permissions for a collection of users, allowing you to assign specific access rights to multiple users at once.

#### **Syntax**

```javascript
await zkdb.database('my-db').createGroup(groupName, groupDescription);
```

#### **Parameters**

- **`groupName`** (String): The name of the group to be created. This should be a unique identifier for the group within the database.

- **`groupDescription`** (String): A description of the group, providing context or details about its purpose and members.

#### **Returns**

- A promise that resolves when the group is successfully created in the database.

#### **Permissions**

- **Database Owner Only**: The createGroup method can only be executed by the owner of the database. If a non-owner user attempts to create a group, the operation will fail with an appropriate error.

#### **Example**

```javascript
await zkdb.database('my-db').createGroup('group-name', 'group description');
```

In this example, a new group named `group-name` with the description `group description` is created in the `my-db` database. This operation will only succeed if the current user is the owner of `my-db`.

#### Important Notes

- **Owner-Only Operation**: Only the database owner has the permissions required to create a group. Ensure that your application logic checks user roles and ownership before attempting to call `createGroup`.

- **Unique Group Names**: Group names must be unique within the database. Attempting to create a group with a duplicate name will result in an error.


### Use Case: Managing Permissions with Groups

Creating groups is essential for managing permissions effectively in a database. By grouping users based on their roles or responsibilities, you can simplify permission management by assigning permissions at the group level rather than individually for each user.

For example, you might create groups such as "Admins", "Editors", or "Viewers" and assign them varying levels of access to different collections or documents. This approach enhances both security and ease of management.

### Summary

The `createGroup` method in zkDatabase provides a powerful way to manage user permissions by grouping users within a database. This method is restricted to database owners, ensuring that only authorized users can modify group structures and permissions, thus maintaining the integrity and security of the database.

