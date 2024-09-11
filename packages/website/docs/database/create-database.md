---
sidebar_position: 1
---

# Creating a Database in zkDatabase

Creating a new database in zkDatabase is a two-step process. First, you deploy a smart contract to the blockchain, which will manage the database’s cryptographic state. After the smart contract is successfully deployed and the transaction is confirmed, you register the database with the zkDatabase service by sending the public key and other metadata, such as the database name and Merkle tree height.

## Steps to Create a Database
1. Deploy the ZK Database Smart Contract to the Blockchain
2. Register the Database with the zkDatabase Service

## Step 1: Deploy the ZK Database Smart Contract

The first step in creating a database is deploying a smart contract to the blockchain. This contract will manage the database’s cryptographic operations, such as updating the Merkle tree that holds the database state.

#### **Syntax**

```ts
const zkDbPrivateKey = PrivateKey.random(); // Generate a private key for the new database

const tx = await zkdb.fromBlockchain()
  .deployZKDatabaseSmartContract(merkleHeight, zkDbPrivateKey);

await tx.wait(); // Wait for the transaction to be confirmed on the blockchain
```

#### **Parameters**

- **`merkleHeight`** (Number): The height of the Merkle tree that will represent the database's state. A larger Merkle height allows the database to handle more entries, but increases the cost of maintaining the tree.

- **`zkDbPrivateKey`** (PrivateKey): A private key generated for the new database. The corresponding public key will be used to identify the database in zkDatabase.

#### **Returns**

- A transaction object (`tx`) representing the deployment of the ZK Database Smart Contract on the blockchain.

#### **Example**

```ts
const zkDbPrivateKey = PrivateKey.random();

const tx = await zkdb.fromBlockchain()
  .deployZKDatabaseSmartContract(18, zkDbPrivateKey);

await tx.wait(); // Wait for the transaction to be confirmed
```

In this example, a private key is generated for the new database, and the ZK Database Smart Contract is deployed to the blockchain with a Merkle tree height of `18`. The `tx.wait()` method is used to wait for the blockchain transaction to be confirmed.

## Step 2: Register the Database with zkDatabase Service

After deploying the smart contract and receiving confirmation from the blockchain, you need to register the database with the zkDatabase service. This step involves sending the public key derived from the private key used in the contract deployment, along with the database name and Merkle tree height.

#### **Syntax**

```ts
await zkdb.fromGlobal()
  .createDatabase(DB_NAME, merkleHeight, PublicKey.fromPrivateKey(zkDbPrivateKey));
```

#### **Parameters**

- `DB_NAME` (String): The name of the database you are creating.
- `merkleHeight` (Number): The height of the Merkle tree (same as in the contract deployment step).
- `PublicKey`: The public key derived from the private key used in the deployment. This public key will be used to authenticate the database in zkDatabase.

#### **Returns**

- A promise that resolves when the database has been successfully created in the zkDatabase service.

#### **Example**

```ts
await zkdb.fromGlobal()
  .createDatabase('my-database', 18, PublicKey.fromPrivateKey(zkDbPrivateKey));
```

In this example, the database is registered with the zkDatabase service under the name `my-database`. The Merkle tree height is set to `18`, and the public key is derived from the private key that was used during the smart contract deployment.