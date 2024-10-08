# Use our customized image based on Node.js 20 slim image as a base
FROM orochinetwork/node:20-iron AS builder

# Create a non-root user and group early in the Dockerfile
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/bash -d /usr/src/app appuser

# Set the working directory
WORKDIR /usr/src/app

# Ensure the non-root user owns the working directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser

# Copy the application code as the non-root user
COPY --chown=appuser:appuser . .
USER root

RUN --mount=type=secret,id=npm,target=/root/.npmrc yarn install --frozen-lockfile

USER appuser

USER root

# Install dependencies with a frozen lockfile and secret npmrc
RUN --mount=type=secret,id=npm,target=/root/.npmrc yarn install --frozen-lockfile

USER appuser

# Build the necessary workspaces
RUN yarn workspace @zkdb/smart-contract build && \
    yarn workspace ftp build

# Use our customized image based on Node.js 20 slim image as a runner
FROM orochinetwork/node:20-alpine AS runner

# Create a non-root user and group in the runner stage
RUN addgroup -S appuser && adduser -S -G appuser -h /usr/src/app appuser

# Set the working directory
WORKDIR /usr/src/app

# Copy the necessary directories and node_modules from the builder stage
COPY --from=builder /usr/src/app/packages/smart-contract /usr/src/app/packages/smart-contract
COPY --from=builder /usr/src/app/packages/ftp /usr/src/app/packages/ftp
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/package.json /usr/src/app/package.json
COPY --from=builder /usr/src/app/yarn.lock /usr/src/app/yarn.lock

# Ensure the non-root user owns the working directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser


# Set the working directory for the FTP package
WORKDIR /usr/src/app/packages/ftp

# Set the entrypoint to the application
ENTRYPOINT ["node", "build/src/index.js"]
