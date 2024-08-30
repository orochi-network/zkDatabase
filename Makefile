# Define variables for Docker image tags and paths
BROKER_SERVICE_TAG = broker-service
PROOF_SERVICE_TAG = proof-service
FTP_SERVICE_TAG = ftp-service
SERVERLESS_TAG = serverless
PLATFORM_TAG = linux/amd64 # You can choose between linux/amd64 for x86_64 and linux/arm64 for arm64

BROKER_SERVICE_DOCKERFILE = packages/broker-service/Dockerfile
PROOF_SERVICE_DOCKERFILE = packages/proof-service/Dockerfile
FTP_SERVICE_DOCKERFILE = packages/ftp/Dockerfile
SERVERLESS_DOCKERFILE = packages/serverless/Dockerfile

BROKER_SERVICE_COMPOSE = packages/broker-service/docker-compose.yml
PROOF_SERVICE_COMPOSE = packages/proof-service/docker-compose.yml
FTP_COMPOSE = packages/ftp/docker-compose.yml
SERVERLESS_COMPOSE = packages/serverless/docker-compose.yml
MONGO_COMPOSE = general/database/docker-compose.yml

# Build Docker images
.PHONY: build
build: build-broker build-proof build-ftp build-serverless

build-broker:
	docker build --no-cache -t $(BROKER_SERVICE_TAG) -f $(BROKER_SERVICE_DOCKERFILE) --platform=${PLATFORM_TAG} .

build-proof:
	docker build --no-cache -t $(PROOF_SERVICE_TAG) -f $(PROOF_SERVICE_DOCKERFILE) --platform=${PLATFORM_TAG} .

build-ftp:
	docker build --no-cache -t $(FTP_SERVICE_TAG) -f $(FTP_SERVICE_DOCKERFILE) --platform=${PLATFORM_TAG} .

build-serverless:
	docker build --no-cache -t $(SERVERLESS_TAG) -f $(SERVERLESS_DOCKERFILE) --platform=${PLATFORM_TAG} .

# Start services with Docker Compose
.PHONY: up
up: up-broker up-proof up-ftp up-serverless up-mongo

up-broker:
	docker compose -f $(BROKER_SERVICE_COMPOSE) up -d 

up-proof:
	docker compose -f $(PROOF_SERVICE_COMPOSE) up -d 

up-ftp:
	docker compose -f $(FTP_COMPOSE) up -d 

up-serverless:
	docker compose -f $(SERVERLESS_COMPOSE) up -d 

up-mongo:
	docker compose -f $(MONGO_COMPOSE) up -d 

# Stop specific services with Docker Compose
.PHONY: stop
stop: stop-broker stop-proof stop-ftp stop-serverless stop-mongo

stop-broker:
	docker compose -f $(BROKER_SERVICE_COMPOSE) down

stop-proof:
	docker compose -f $(PROOF_SERVICE_COMPOSE) down

stop-ftp:
	docker compose -f $(FTP_COMPOSE) down

stop-serverless:
	docker compose -f $(SERVERLESS_COMPOSE) down

stop-mongo:
	docker compose -f $(MONGO_COMPOSE) down

# Stop and remove containers, networks, images, and volumes for all services
.PHONY: down
down: stop-broker stop-proof stop-ftp stop-serverless stop-mongo

# Clean up Docker images
.PHONY: clean
clean:
	docker rmi -f $(BROKER_SERVICE_TAG) $(PROOF_SERVICE_TAG) $(FTP_SERVICE_TAG) $(SERVERLESS_TAG)

# Create zk network
.PHONY: network
create-network:
	docker network create zk