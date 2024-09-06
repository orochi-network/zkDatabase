---
sidebar_position: 1
---

# Fetching Data from zkDatabase

The zkDatabase library provides methods for retrieving documents from a specified collection within a database. These methods allow you to fetch either a single document or multiple documents based on query parameters. **Note that these methods will only work if the user has the necessary permissions to access the specified collection or document.**

### **Fetching a Single Document: `fetchOne`**

The `fetchOne` method retrieves a single document from the specified collection that matches the provided query criteria.

#### **Syntax**

```javascript
await zkdb.database('my-db').from('my-collection').fetchOne(query);
```

#### **Parameters**

- **`query`** (Object): An object representing the query criteria to match documents in the collection. The query should use MongoDB-like syntax, where the key is the field name and the value is the condition to match. This allows for flexible querying, such as using operators for comparison, logical operations, or regular expressions.

#### **Returns**

- A promise that resolves to the first document matching the query criteria. If no documents match or if the user lacks the necessary permissions, the promise resolves to `null`.

#### **Permissions**

- The `fetchOne` method requires that the user has read permissions for the collection or specific document being queried. If the user lacks these permissions, the method will not return any results.

#### **Example**

```javascript
await zkdb.database('my-db').from('my-collection').fetchOne({ name: 'Alice' });
```

In this example, `fetchOne` is used to retrieve the first document in `my-collection` within `my-db` where the `name` field is equal to `12`. This operation will only succeed if the user has the appropriate read permissions for `my-collection` or the specific document.

### **Fetching Multiple Documents: `fetchMany`**

The `fetchMany` method retrieves multiple documents from the specified collection that match the provided query criteria, with options for pagination.

#### **Syntax**

```javascript
await zkdb.database('my-db').from('my-collection').fetchMany(query, options);
```

#### **Parameters**

- **`query`** (Object): An object representing the query criteria to match documents in the collection. The query should use MongoDB-like syntax, where the key is the field name and the value is the condition to match. This allows for flexible querying, such as using operators for comparison, logical operations, or regular expressions.
  
- **`options`** (Object): An optional object to specify additional options for the query:
  - **`limit`** (Number): The maximum number of documents to return.
  - **`offset`** (Number): The number of documents to skip before starting to return results.

#### **Returns**

- A promise that resolves to an array of documents matching the query criteria. If no documents match or if the user lacks the necessary permissions, the promise resolves to an empty array.

#### **Permissions**

- The `fetchMany` method requires that the user has read permissions for the collection being queried. If the user does not have the required permissions, the method will not return any results.

#### **Example**

```javascript
await zkdb.database('my-db').from('my-collection').fetchMany(
  { name: 'Bob' },
  {
    limit: 10,
    offset: 20,
  }
);
```

In this example, `fetchMany` is used to retrieve up to 12 documents in `my-collection` within `my-db` where the `name` field is equal to `12`. The query skips the first 12 matching documents (due to the `offset` option) and returns the next 12. This operation will only succeed if the user has the necessary read permissions for `my-collection`.

### **Additional Notes**

- **Error Handling:** Both `fetchOne` and `fetchMany` return promises, so you should handle errors using `.catch()` or `try...catch` blocks to manage any exceptions or errors that occur during the fetch operation.
- **Performance Considerations:** Using `limit` and `offset` with `fetchMany` can help manage performance by controlling the number of documents retrieved, especially in large datasets.
- **Permissions Management:** Ensure that your application has the correct permission management logic to allow users to access the necessary collections or documents. Without proper permissions, the fetch operations will not return any data.

### **Summary**

The `fetchOne` and `fetchMany` methods in zkDatabase provide powerful tools for querying and retrieving data from your databases, provided the user has the necessary permissions. They allow you to specify precise criteria and handle large datasets efficiently, making them ideal for building robust and scalable applications.