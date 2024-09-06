---
sidebar_position: 2
---

# Settings

In zkDatabase, the `getSettings` method allows you to retrieve important settings related to a specific database, including the public key and Merkle tree height. These settings are crucial for understanding the cryptographic configuration of the database.

## getSettings: Retrieving Database Configuration

The `getSettings` method is used to fetch the current configuration settings of a database. This includes the public key associated with the database and the Merkle tree height, which defines the capacity and scalability of the database.

#### **Syntax**

```ts
const settings = await zkdb.database('my-db').getSettings();
```

#### **Returns**

- A promise that resolves to a `DatabaseSettings` object containing the database's public key and Merkle tree height.

**DatabaseSettings Type**

```ts
export type DatabaseSettings = {
  publicKey: string;     // The public key associated with the database
  merkleHeight: number;  // The height of the Merkle tree representing the database's state
};
```

#### **Example**

```ts
const settings = await zkdb.database('my-db').getSettings();

console.log('Database Public Key:', settings.publicKey);
console.log('Merkle Tree Height:', settings.merkleHeight);
```

In this example, the `getSettings` method retrieves the public key and Merkle tree height for the database `my-db`, and logs them to the console.