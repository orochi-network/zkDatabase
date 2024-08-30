<p align="center">
    <img src="./assets/zkdatabase.png" alt="Zero-Knowledge Database">
</p>

## Introduction

Welcome to the future of decentralized application development with **zkDatabase**. In a world where sluggish client-side operations often hinder innovation, zkDatabase is set to revolutionize the landscape. As pioneers in the field, we understand the challenges of slow development speeds and are dedicated to transforming them with our innovative solutions. **zkDatabase as a service** is more than just an enhancement; it represents a significant leap forward in ensuring **data integrity and ease** of use, propelling the pace of development forward and setting new standards in the industry.

Leveraging our deep expertise, we are addressing one of the **most critical challenges** faced by decentralized databases: slow client-side proving and data retrieval. With **zkDatabase as a service**, we provide a platform that allows users to offload complex tasks, ensuring **data privacy and verifiability**. This not only enhances the user experience but also accelerates the development of zkApps, paving the way for their broader adoption and reshaping the future of decentralized applications.

**It's time for provable data.**

## Problem Statement

### Cost and Complexity

Small and middle-sized zkApps may find the costs prohibitive when considering the development of their own Layer 2 solutions. However, zkDatabase as a Service (AaS) can offer significant long-term cost savings through techniques like replication sets or sharding. Furthermore, the complexity associated with managing interactions between blockchain systems and proof systems can be significantly reduced through user-friendly APIs that abstract away the underlying details.

### Scalability and Performance

Although scalability remains a challenge within Web3 technologies, zkDatabase AaS has the potential to integrate traditional scalability solutions with the unique properties of Zero-Knowledge Proofs. This combination maintains the performance benefits of centralized systems while incorporating the verifiable and trustless properties of ZKPs.

### Web3 Potential, Web2 Reality

The vision of Web3 promises a decentralized and secure infrastructure, which holds immense potential. However, the current state of Web3 infrastructure is often complex and incomplete, making it daunting and impractical for many developers and users to adopt and implement effectively.

### The limitation of client side proving

Client-side proving is undoubtedly a future milestone for zkApp development; however, it currently faces substantial limitations in practical implementation, such as issues with hardware acceleration, parallelization capabilities, and memory requirements.

### Lack of usabilities and toolkit

In the pursuit of decentralization and the technological edge, many projects overlook the critical aspect of usability. This oversight makes it challenging to onboard new developers to zkApp development in the short term. A focused effort on enhancing the usability and providing comprehensive toolkits and documentation is essential for bridging this gap, ensuring developers can efficiently leverage the full potential of zkApps and Zero-Knowledge Proofs in their applications.

### Lack of Secure Authentication in Decentralized Systems

In the realm of decentralized applications (dApps) and databases, ensuring secure and reliable user authentication is paramount. Traditional authentication methods often fall short in providing the necessary security and privacy for users in a decentralized environment. Without a robust authentication mechanism like Public Key Authentication, systems are vulnerable to a range of security threats, including:

1. **Man-in-the-Middle Attacks**: Attackers can intercept and manipulate communication between users and the system, leading to potential data breaches and unauthorized access.

2. **Replay Attacks**: Without proper authentication, attackers can reuse valid data transmission to gain unauthorized access or perform unauthorized actions.

3. **Phishing Attacks**: Users can be tricked into revealing sensitive information, such as passwords, which can be exploited in the absence of a secure authentication method.

4. **Impersonation**: Without Public Key Authentication, it's challenging to verify the identity of users, leading to risks of impersonation and fraudulent activities.

### Inconvenient data management

Manual data management can be time-consuming and error-prone, making it difficult to identify and fix errors that could have significant consequences for a project or business.

## Solution

<p align="center">
    <img src="./assets/zkdatabase-ass-architecture.jpg" alt="Zero-Knowledge Database architecture">
</p>

### zkDatabase in serverless fashion

zkDatabase manages the underlying infrastructure, including servers, storage, networking and proof generating. This frees developers from the burden of managing and maintaining their own infrastructure, allowing them to focus on building their applications.

### Scaling Decentralized Applications with zkDatabase AaaS

zkDatabase AaaS leverages traditional scalability solutions and Zero-Knowledge Proof (ZKP) properties to maintain the performance advantages of centralized systems while ensuring verifiable security.

### Bridging Web3 Potential and Web2 Reality with zkDatabase

zkDatabase aims to bridge the gap between Web3's potential and Web2's reality by providing a more accessible and user-friendly platform for decentralized application development.

### Overcoming Client-Side Proving Limitations with zkDatabase

zkDatabase addresses these limitations by offloading some of the proving responsibilities to the server-side, reducing the computational burden on the client-side.

### Enhancing Usability and Toolkits for zkApp Development with zkDatabase

zkDatabase aims to improve usability by providing comprehensive toolkits, documentation, and support to streamline the development process and make it more accessible to newcomers.
 
### Public Key Authentication for Enhanced Security

zkDatabase employs Public Key Authentication to securely authenticate user sessions, ensuring only authorized access. It also uses session keys to efficiently verify asymmetric signatures, enhancing security without sacrificing performance.

### Graphical User Interface

Our graphical user interface simplifies the data management process by offering a visual representation of the data, allowing for more efficient manipulation, analysis, and collaboration while ensuring accuracy.

_The graphical user interface provided by zkDatabase offers an intuitive and user-friendly way to manage data. It allows users to easily navigate through the database and provides a visual representation of the data, making it easier to understand and manipulate. Overall, the GUI helps to streamline the data management process, saving time and improving productivity._

## Architecture

**The zkDBaaS architecture consists of the following key components:**

- zkApp:
  - Client-side application that interacts with zkDBaaS.
  - Includes a user interface (zkApp UI) and an application-specific smart contract (App Smart Contract) for managing application-level logic.

- zkDatabase Smart Contract:
  - Manages data commitment and proof generation on the Mina blockchain.
  - Interacts with zkDatabase Client for data updates and queries.

- zkDatabase Client:
  - Provides an interface for applications to interact with zkDBaaS.
  - Handles data updates and queries, interacting with the zkDatabase Smart Contract and zkDatabaser aaS.

- zkDatabaser aaS:
  - Core service layer responsible for:
    - Data commitment to the Mina blockchain
    - Proof accumulation and verification
    - Data storage and retrieval using MongoDB
    - Public key authorization
    - Permission management

- MongoDB Replica Set:
  - Underlying database for storing committed data.
  - Provides high availability and scalability.
 
**Component Interactions:**

  - Data Updates:
    - zkApp initiates a data update request through the zkDatabase Client.
    - zkDatabase Client forwards the request to zkDatabaser aaS.

  - zkDatabaser aaS:
    - Verifies authorization using public key authentication.
    - Persists data to MongoDB.
    - Generates a zero-knowledge proof of the update.
    - Commits the proof to the Mina blockchain through the zkDatabase Smart Contract.

  - Data Queries:
    - zkApp initiates a data query request through the zkDatabase Client.
    - zkDatabase Client forwards the request to zkDatabaser aaS.

  - zkDatabaser aaS:
    - Retrieves data from MongoDB.
    - Generates a zero-knowledge proof of the query result (Lookup Prover).
    - Returns the proof to the zkDatabase Client.
    - zkDatabase Client verifies the proof and returns the verified data to zkApp.

## Specification

The specification of zkDatabase was moved [here](https://docs.orochi.network/zkdatabase/chapter.html).

## Installation
Refer to the [installation guide](Installation.md) for detailed instructions on setting up zkDatabase.

## Contribute

This section will be updated soon but all contributions are welcomed, feeling free to create a [pull request](https://github.com/orochi-network/zkDatabase/pulls).

Please reach out to us on [zkDatabase @ Discord](https://discord.com/channels/1069494820386635796/1069500366145724476).

## Donation and Grants

Our financial report can be tracked here [zkDatabase financial report](https://docs.google.com/spreadsheets/d/14R24hdgQGp9RdkOmjAM_l3ZQiZXsbxXD06KjZ3a8Ct0/edit?usp=sharing)

## License

The source code of zkDatabase was licensed under [Apache-2.0](./LICENSE) that means you are a co-owner of project, the ownership depends on the stake and effort that you put in this project.
