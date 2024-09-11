---
sidebar_position: 1
---

# Deleting a Single Document in zkDatabase
The `update` method in zkDatabase allows you to modify specific fields of a document in a collection. You can update one or more fields in the document by specifying the new values you want to set.

## update: Modifying an Existing Document

The `update` method is used to update a document in a collection by providing the document object and the fields to be updated. This allows you to partially modify documents without replacing the entire document.

#### Syntax
```ts
await zkdb.database('my-db').from('my-collection').update(document, updates);
```

#### Parameters
- **`document`** (Object): The document object that identifies the document to be updated. This typically includes fields like unique identifiers, such as a name or ID, that are used to locate the document in the collection.

- **`updates`** (Object): An object specifying the fields and their new values that need to be updated in the document. The structure is a key-value pair where the key is the field name and the value is the new value to update.

#### Returns
- A promise that resolves when the document has been successfully updated in the collection.

#### Example
```ts
const developer = new Developer({ name: 'Anton', age: UInt32.from(30) });

// Update the developer's age from 30 to 29
await zkdb.database('my-db').from('my-collection').update(developer, { age: 29 });
```

In this example, the `update` method updates the `age` field of the document identified by `developer` in the `my-collection` collection within the `my-db` database. The developer’s age is changed from `30` to `29`.

## Summary

The `update` method in zkDatabase provides an efficient way to modify specific fields in a document without needing to replace the entire document. With a clear query and update pattern, this method allows for partial updates, ensuring flexible data management in zkApps.