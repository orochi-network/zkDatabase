<p align="center">
    <img src="./assets/zkdatabase.png" alt="Zero-Knowledge Database">
</p>

## Introduction

Data is vital for arbitrary computational processes and is also essential for Web3. To get into the Web3 era, we must improve availability and correctness. zkDatabase utilized distributed storage to improve accessibility and availability, while Zero-Knowledge Proof is used to prove the correctness.

**It's time for provable data.**

## What is zkDatabase?

zkDatabase is a database that utilize Zero-Knowledge Proof (ZKP) to prove the correctness of the data and data processing. As far as we know, every [zkApp](https://minaprotocol.com/zkapps) need to manage their own on-chain and off-chain state themselves, this is costly and inefficient depend on the complexity of data's structure. We want to help other team to build their zkApp by providing the most critical component, the database.

## Problem Statement

### Single point of failure

The current approach of off-chain storage is facing a single point for failure issue, where the data wasn't replicated and we are unable to recover from fault.

### Accessibility

An off-chain storage can be achieved with ZKP and Merkle tree, we can easily prove the immutability of the data, but the data itself can not be accessible to everyone even when the data is public.

### Inconsistent data structure

The information (the raw data) itself is meaningless without the process of creating structured and sorted data. We can't let every zkApp handle this themselves since it lead to inconsistency and lack of extendability.

### Lack of indexing

Every zkApp is stopping with Key-Value lookup instead of allow a field of structured data to be indexed. It lower the potential of off-chain data storage and limit the abilities of zkApp.

### Unextendable

Maintaining a database is not only about keeping it working but also evolving to adapt to the changes of your business. There is no such tool solve this issue completely.


### The overhead in development

Every zkApp developer need to manage off-chain and on-chain state themselves, it slows down the development process and it also increases the fractionalization of the data over time.

### Inconvenient data management

Coping with data in your project might be time-consuming and error-prone task. Manually managing data can make it challenging to identify and rectify errors, and any errors could have serious consequences for the project or business. 

## Solution

### Distributed storage engine

A distributed storage will be used to serve the data and prevent single point of failure, it allows everyone with a replication of the data to reconstruct the database and its Merkle tree. Recovery from fault is an essential feature.

Cryptographic authorization & encryption Public data will be accessible for everyone. Private data is encrypted and authorization based. 

BSON document will be used to enforce the data structure. All data must match with a predefined schema, which is necessary to keep the database consistent.

### B-tree

B-tree will be used to index the data and allow efficient data  lookup. The lookup process need to be proved by creating a link between B-tree and Merkle tree.

### Transforming proof

We allow users to update their document's schema by providing a migrating/transforming proof, this process require effort in R&D.

### Standardized

zkDatabase propose a proper way to create, update, manage the database  with a developer friendly library. Developers can focus on developing their idea instead of wasting time managing states.

### Graphical User Interface

Our UI can simplify the process of data management, providing a visual representation of the data and allowing for more efficient and accurate manipulation, analysis and collaboration.

## Current stage of development

We are a team of four (Chiro, Flash, JoeEdoh, robi) and we're participating [zkIgnite cohort 1](https://minaprotocol.com/blog/zkignite-cohort-1-program-overview). We want to provide zkDatabase as a [npm package](https://www.npmjs.com/package/zkdatabase), following features will available in `0.1.0`:

- JSON and BSON document
- Lookup the data by a single key (multiple index might need time to develop)
- Storing data and merkle tree on [IPFS](https://ipfs.tech/)

## Specification

We need your help to write the specification. The specification will be in a [different document](./specs/README.md).

## Contribute

This section will be updated soon but all contributions are welcomed, feeling free to create a [pull request](https://github.com/orochi-network/zkDatabase/pulls).

Please reach out to us on [zkDatabase @ Discord](https://discord.com/channels/1069494820386635796/1069500366145724476).

## Donation and Grants

Our financial report could be track here [zkDatabase financial report](https://docs.google.com/spreadsheets/d/14R24hdgQGp9RdkOmjAM_l3ZQiZXsbxXD06KjZ3a8Ct0/edit?usp=sharing)

## License

The source code of zkDatabase was licensed under [Apache-2.0](./LICENSE) that meant you are a co-owner of project, the ownership depends on the stake and effort that you put in this project.
