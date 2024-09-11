---
sidebar_position: 1
---

# Introduction

Discover the power of zkDatabase as a Service.

## Getting Started

Begin your journey with zkDatabase by understanding its core features and setting up a simple example.

### What you'll need

- Node.js version 18.0 or higher
- The `o1js` library
- A basic understanding of Zero-Knowledge Proofs (ZKP), the `o1js` library, and NoSQL databases

## Create a new instance of zkDatabase

To create a new zkDatabase instance and get started, follow these steps:

1. Install zkDatabase SDK: Use npm to install the zkDatabase SDK in your project:

```bash
npm install zkdb
```

This command initializes your project with the necessary dependencies to interact with zkDatabase as a Service. 

## Start using zkDatabase

To start using zkDatabase, you’ll first need to configure your connection settings and initialize the database in your application. Here’s how:

```ts
import {zkdb} from 'zkdb';

await zkdb.auth.signIn('test@gmail.com');
```

This code snippet demonstrates how to set up a connection to zkDatabase, configure Zero-Knowledge Proof options, and initialize a connection to your zkDatabase service.

## What Can zkDatabase Do?

zkDatabase as a Service provides a robust, scalable platform for managing data with verifiability and privacy at its core. Here's what you can do with zkDatabase:

- User Authentication and Management: Implement secure user authentication with built-in support for Zero-Knowledge Proofs.

- Data Privacy and Verifiability: Ensure data privacy and verifiability by offloading complex proving tasks to the server.

- Efficient Data Handling: Optimize data retrieval and storage in a distributed environment using MongoDB Atlas Clusters.

- Standardized GUI Interface: Simplify data management with a user-friendly graphical interface for interacting with zkDatabase.