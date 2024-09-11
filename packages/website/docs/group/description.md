---
sidebar_position: 2
---

# Managing Group Descriptions in zkDatabase

In zkDatabase, group descriptions provide metadata that offers insights into the purpose and creation details of a group. The `getDescription` and `changeDescription` methods allow authorized users to retrieve and update the description of a group.


## getDescription: Retrieving Group Description

The `getDescription` method retrieves the current description and metadata of a group. This method is useful for displaying group information, such as the name, description, and details about when and by whom the group was created.

#### **Syntax**

```ts
const description = await zkdb.database('my-db').getDescription();
```

#### **Returns**

- A promise that resolves to a `GroupDescription` object containing the group's current name, description, and creation details.

#### **GroupDescription Type**

```ts
export type GroupDescription = {
  name: string;          // The name of the group
  description: string;   // A description of the group
  createdBy: string;     // The user who created the group
  createdAt: Date;       // The date and time when the group was created
};
```

#### **Example**

```ts
const groupDescription = await zkdb.database('my-db')
  .fromGroup('my-group')
  .getDescription();

console.log('Group Name:', groupDescription.name);
console.log('Description:', groupDescription.description);
console.log('Created By:', groupDescription.createdBy);
console.log('Created At:', groupDescription.createdAt);
```

In this example, the method retrieves the current description of the group in the` my-db` database, including the group name, description, creator, and the date it was created.