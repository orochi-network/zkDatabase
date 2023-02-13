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

**HELP** We need to clarify which kind of data type will be supported and how could we make it compatible with zkApp (SnarkyJS)

## Index BSON Document

**HELP** We need specified which method would be the best to index data, and the index method should be provable by SnarkyJS.

## Proving Lookup Process

**HELP** This section we will clarify how could we prove the lookup process, for example if you used b-tree to index the data, we might need to create a prove that prove the lookup process on b-tree.

## The Front-end

**HELP** We need to display the database in the front-end.

## Extendable BSON Document

**HELP** What will happens if we change the data structure? is it possible to keep the data structured consistent?
