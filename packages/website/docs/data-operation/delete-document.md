---
sidebar_position: 1
---

# Deleting a Single Document in zkDatabase
The `delete` method in zkDatabase allows you to remove a specific document from a collection based on query criteria. This operation is crucial for managing and cleaning up data within your database.

## delete: Deleting a Single Document

The `delete` method deletes a document that matches the provided query from a specific collection in the database. The query should specify the criteria that identify the document you want to delete, such as a field name and value.

#### Syntax
```ts
await zkdb.database('my-db').from('my-collection').delete(query);
```

#### Parameters
- **`query`** (Object): An object representing the criteria to match the document you want to delete. The query is MongoDB-like, where the key is the field name and the value is the condition to match.

#### Returns
- A promise that resolves when the document is successfully deleted or rejects if the operation fails.

#### Example
```ts
await zkdb.database('my-db').from('my-collection').delete({ name: 'Alice' });
```

In this example, the method deletes the document from the `my-collection` collection in the `my-db` database where the `name` field is equal to `Alice`.
'
## Summary

The `delete` method in zkDatabase provides a straightforward way to delete a single document from a collection based on a query. It ensures efficient data management and cleanup while enforcing query-based deletion with MongoDB-like query syntax.