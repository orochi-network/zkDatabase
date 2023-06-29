## zkDatabase Specification

In this specification, we will clarify every technical detail to build up zkDatabase. Since the zkDatabase is built by using TypeScript so the specification is also used TypeScript as the main language.

## Hash Function

We're using [poseidon](https://dusk.network/news/poseidon-the-most-efficient-zero-knowledge-friendly-implementation) hash function to keep the verification on zk-SNARK more efficient since `poseidon` is zk friendly.

## Merkle Tree

To keep our merkle tree verification succinct, efficient and friendly with [SnarkyJS](https://github.com/o1-labs/snarkyjs). A poseidon merkle tree will be used to prove the immutability of the data.

**HELP** How do we store the merkle tree? where do we store the merkle tree? How could we reconstruct the merkle tree?

## Distribute Storage

There are many distributed solutions out there, we need to define an unified front-end interface for all distributed storages from which we can guarantee that our zkDatabase is extendable and adaptable with different kind of distributed storage back-end.

```ts
export interface IStorageEngine {
  set(key: string, value: string): Promise<string>;
  get(key: string): Promise<string>;
}
```

**HELP** We need to clarify how do we store raw data, lookup raw data and how could we reconstruct the merkle tree.

### IPFS

In this version, we featured [IPFS](https://ipfs.tech/) as a default distributed storage.

```bash
npm install ipfs-core
```

`js-ipfs` is a good starting point to try, do experiment. We might need to be familiar with [ipfs core API](https://github.com/ipfs/js-ipfs/tree/master/docs/core-api).

## BSON Document

zkDatabase isn't just support ordinary Key-Value storage but also support BSON document. That meant, you can define data structure on your own.

**HELP** We need to clarify the limit of zkDatabase BSON based on [MongoDB spec](https://www.mongodb.com/docs/v2.2/core/document/)

## Data Type

### SnaryJS supported types

- **Built-in types**
  - Field
  - Bool
  - UInt32
  - UInt64
  - PublicKey
  - PrivateKey
  - Signature
  - Group
  - Scalar
  - CircuitString
  - Character
- **Custom types**
  - Struct [\*](https://docs.minaprotocol.com/zkapps/snarkyjs-reference/modules#struct-1)
- **Trees**
  - MerkleTree
  - MerkleMap

### Bson supported types

- Double
- String
- Object
- Array
- Binary data
- Undefined
- ObjectId
- Boolean
- Date
- Null
- Regular Expression
- DBPointer
- JavaScript
- Symbol
- 32-bit integer
- Timestamp
- 64-bit integer
- Decimal128
- Min key
- Max key

### Serialization/Deserialization

The provided code snippet demonstrates how to convert a zk-snark data type into a BSON-supported format by first converting the value into a Uint8Array and then serializing it using BSON.

```ts
const value = UInt64.from(12342);
const bytes: Uint8Array = Encoding.Bijective.Fp.toBytes(value.toFields());
const bson = BSON.serialize({ bytes });
```

This code snippet demonstrates the process of converting BSON data back into a zk-SNARK data type. This is done by first deserializing the BSON data into a JavaScript object, then converting the Binary data into a Uint8Array, and finally using a built-in decoding method to reconstruct the original value from the byte array.

```ts
const deserializedBson = BSON.deserialize(bson);
const convertedResult = new Uint8Array(deserializedBson.bytes.buffer);
const initialField = Encoding.Bijective.Fp.fromBytes(convertedResult);
```

### Serializing Arbitrary Data into Field Elements

When serializing arbitrary data into field elements, it's important to note that field elements can hold a maximum of 254 arbitrary bits (not 255) due to the largest possible field element lying between 2^254 and 2^255.

You can utilize the `Encoding.bytesToFields` method, which efficiently packs 31 bytes per field element for serialization.

**HELP** We need to clarify which kind of data type will be supported.

## Index BSON Document

**HELP** We need specified which method would be the best to index data, and the index method should be provable by SnarkyJS.

## Proving Lookup Process

**HELP** This section we will clarify how could we prove the lookup process, for example if you used b-tree to index the data, we might need to create a prove that prove the lookup process on b-tree.

## The Front-end

**HELP** We need to display the database in the front-end.

## Extendable BSON Document

**HELP** What will happens if we change the data structure? is it possible to keep the data structured consistent?

## Data Collection

Data collection occures by requesting `events` from the Mina blockchain, which are fired from `SmartContract`.

### Smart Contract

Define _names_ and _types_ of your events:

```ts
events = {
  "arbitrary-event-key": Field,
};
```

In order to send data to the blockchain with use the following method:

```ts
this.emitEvent("arbitrary-event-key", data);
```

### Off-chain

The most convenient way to pull `events` off the blockchain is by [making graphql request](https://berkeley.graphql.minaexplorer.com/):

**Request**

```gql
query getEvents($zkAppAddress: String!) {
  zkapps(
    query: {
      zkappCommand: { accountUpdates: { body: { publicKey: $zkAppAddress } } }
      canonical: true
      failureReason_exists: false
    }
    sortBy: BLOCKHEIGHT_DESC
    limit: 1000
  ) {
    hash
    dateTime
    blockHeight
    zkappCommand {
      accountUpdates {
        body {
          events
          publicKey
        }
      }
    }
  }
}
```

The response depends on the state of the smart contract, but it will be something like this:

**Response**

```json
{
  "data": {
    "zkapps": [
      {
        "blockHeight": 17459,
        "dateTime": "2023-02-21T13:15:01Z",
        "hash": "CkpZ3ZXdPT9RqQZnmFNodB3HFPvVwz5VsTSkAcBANQjDZwp8iLtaU",
        "zkappCommand": {
          "accountUpdates": [
            {
              "body": {
                "events": ["1,0"],
                "publicKey": "B62qkzUATuPpDcqJ7W8pq381ihswvJ2HdFbE64GK2jP1xkqYUnmeuVA"
              }
            }
          ]
        }
      },
      {
        "blockHeight": 17458,
        "dateTime": "2023-02-21T13:09:01Z",
        "hash": "CkpaEP2EUvCdm7hT3cKe5S7CCusKWL2JgnJMg1KXqqmK5J8fVNYtp",
        "zkappCommand": {
          "accountUpdates": [
            {
              "body": {
                "events": [],
                "publicKey": "B62qkzUATuPpDcqJ7W8pq381ihswvJ2HdFbE64GK2jP1xkqYUnmeuVA"
              }
            }
          ]
        }
      },
      {
        "blockHeight": 17455,
        "dateTime": "2023-02-21T12:48:01Z",
        "hash": "CkpZePsTYryXnRNsBZyk12GMsdT8ZtDuzW5rdaBFKfJJ73mpJbeaT",
        "zkappCommand": {
          "accountUpdates": [
            {
              "body": {
                "events": ["13,12"],
                "publicKey": "B62qkzUATuPpDcqJ7W8pq381ihswvJ2HdFbE64GK2jP1xkqYUnmeuVA"
              }
            }
          ]
        }
      }
    ]
  }
}
```

### Events

It is possible to send up to **16 fields** in events in a single transaction, and each field can be up to **255 bits**.

**HELP:**

1. Should we agree on particular structure for `Events` to identify its purpose? It could be the command (Add, Remove, Update, etc.).
2. When `events` are to be requested from the blockchain? Should we use a cron job or subscribe on node changes (if supported).

---
