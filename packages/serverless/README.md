## Introduction

zkDatabase as a service, it used the same license with [MongoDB](https://www.mongodb.com/).

## MongoDB Replica Set Setup

### Prerequisites

- Docker and Docker Compose
- OpenSSL (for generating the keyfile)

### Setup Instructions

1. Generate Keyfile for Replica Set Authentication
Run the setup.sh script to generate a keyfile for internal authentication between replica set members:

```bash
cd scripts
./setup.sh
```

This script creates a keyfile in the mongo-keyfile directory, which is used by MongoDB for authentication.

2. Start MongoDB with Docker Compose
Launch the MongoDB container with the replica set configuration using Docker Compose:

```bash
docker-compose up -d
```
This will start a MongoDB instance with the replica set named rs0 and enable keyfile-based authorization.

3. Copy the `.env.example` file to a new file named `.env`. And edit the `.env` file and replace the placeholder values with your actual environment-specific values.

Url: `mongodb://admin:password@127.0.0.1:27017/?directConnection=true`

## License

This project is licensed under the Server Side Public License - see the [LICENSE](LICENSE) file for details

_built with <3_
