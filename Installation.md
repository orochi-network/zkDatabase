# zkDatabase Installation Guide

## Prerequisites

- Ensure you have [Git](https://git-scm.com/downloads), [Yarn](https://classic.yarnpkg.com/en/docs/install), and [Docker](https://docs.docker.com/get-docker/) installed on your system.

## 1. Clone the Repository

First, clone the `zkDatabase` repository and navigate into the directory:

```bash
git clone https://github.com/orochi-network/zkDatabase
cd zkDatabase
```

## 2. Install Dependencies

Use Yarn to install all required dependencies:

```bash
yarn install
```

## 3. Build the Project

Build the project, which will compile all packages located in the `packages` directory:

```bash
yarn run build
```

## 4. Set Up Environment Variables

Each package in the `packages` directory has its own `.env.example` file. Copy these files to `.env` and modify them as needed:

```bash
cp packages/your-package/.env.example packages/your-package/.env
```

Make sure to adjust any configurations in the `.env` files according to your environment.

## 5. Start MongoDB Replica Set

The project requires a running MongoDB replica set. Start the MongoDB instance using the provided script:

```bash
cd general/database/script
chmod +x start.sh
./start.sh
cd ..
docker compose up -d
```

You can modify the environment variables in the `docker-compose.yml` file based on your requirements. If you keep the default settings, your MongoDB URL will be:

```bash
MONGODB_URL="mongodb://admin:password@mongo:27017/?directConnection=true"
```

## 6. Configure Services

### Proof-Service Setup

To start `mina-service`, you need to run `broker-service` first. Then, set the `BROKER_URL` in the `.env` file of `mina-service` to:

```bash
BROKER_URL="http://broker-service-app-1:4001/graphql"
```

Make sure to adjust the service name if necessary based on your Docker setup.

## 7. Start Individual Services

You can start individual services by navigating into each package directory and running the following command:

For example, to start the FTP service:

```bash
cd packages/ftp
yarn start
```

## 8. Build and Run Docker Images

### 8.1 Create Docker Network

Before building and running Docker images, create the necessary Docker network:

```bash
make create-network
```

This command will create a `zk` network if it does not already exist. You can change the network name in the `Makefile` if needed.

### 8.2 Build Docker Images

To build Docker images for all services:

```bash
make build
```

This command will build the following services: `ftp`, `mina-service`, `broker-service`, and `serverless`.

To build a specific service, such as `ftp`, use:

```bash
make build-ftp
```

### 8.3 Run Docker Services

To run all services:

```bash
make up
```

To run a specific service, such as `ftp`:

```bash
make up-ftp
```

To run multiple specific services, such as `ftp` and `mina-service`:

```bash
make up-ftp up-proof
```

## 9. Stop Docker Services

### 9.1 Stop All Services

To stop all running services:

```bash
make down
```

### 9.2 Stop Specific Services

To stop specific services, such as `ftp` and `mina-service`:

```bash
make stop-ftp stop-proof
```
