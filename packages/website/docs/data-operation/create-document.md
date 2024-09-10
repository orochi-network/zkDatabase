---
sidebar_position: 1
---

# Inserting Data into zkDatabase

The zkDatabase library provides the `insert` method to add new documents to a specified collection within a database. This method supports both basic and advanced usage, allowing you to specify detailed permissions for different users or groups.

## Basic Insertion: insert Method
The `insert` method allows you to add a new document to a collection in your database.

#### Syntax
```ts
await zkdb.database('my-db').from('my-collection').insert(schema);
```

#### Parameters
- **`document`** (Object): The document to be inserted into the collection. This should be an instance of a class representing the data structure, such as TShirt.

#### Returns
- A promise that resolves when the document is successfully inserted into the collection.

#### Example
```ts
const shirt = new TShirt({
  name: CircuitString.fromString('Guchi'),
  price: UInt64.from(12),
});

await zkdb.database('my-db').from('my-collection').insert(shirt);
```

In this example, a new `TShirt` schema is created with the name `Guchi` and a price of `12`. The `insert` method is then called to add this `TShirt` object to the `my-collection` collection in the `my-db` database.

## Advanced Insertion with Permissions
The `insert` method also supports an optional `permissions` object, allowing you to define read, write, delete, create, and system permissions for the document being inserted. This provides granular control over who can access or modify the data.

#### Syntax
```ts
await zkdb.database('my-db').from('my-collection').insert(document, permissions);
```

#### Parameters
- **`document`** (Object): The document to be inserted into the collection. This should be an instance of a class representing the data structure, such as TShirt.

- **`permissions`** (Object, Optional): An object specifying the permissions for the document. It has three sub-objects:

  - **`permissionOwner`** (Object): Permissions for the owner of the document.
  - **`permissionGroup`** (Object): Permissions for a specific group.
  - **`permissionOther`** (Object): Permissions for all other users.

Each sub-object can have the following boolean properties:

- `read`: Allows reading the document.
- `write`: Allows modifying the document.
- `delete`: Allows deleting the document.
- `create`: Allows creating new documents.
- `system`: Allows system-level access to the document.

#### Returns
- A promise that resolves when the document is successfully inserted with the specified permissions.

#### Example
```ts
await zkdb.database('my-db').from('my-collection').insert(shirt, {
  permissionOwner: {
    read: true,
    write: true,
    delete: true,
    create: true,
    system: true,
  },
  permissionGroup: {
    read: true,
    write: true,
    delete: true,
    create: true,
    system: true,
  },
  permissionOther: {
    read: true,
    write: true,
    delete: true,
    create: true,
    system: true,
  },
});
```

In this example, the `TShirt` object is inserted into the `my-collection` collection with detailed permissions. The `permissionOwner`, `permissionGroup`, and `permissionOther` objects specify full access (`read`, `write`, `delete`, `create`, `system`) for the owner, a specific group, and other users, respectively.

## Summary

The insert method in zkDatabase is a versatile tool for adding new documents to your database. Whether you need a simple insert operation or a more advanced one with detailed permissions, zkDatabase provides the flexibility to handle a wide range of use cases securely and efficiently.