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

# Copy the application code
COPY --chown=appuser:appuser . .

# Install dependencies with a frozen lockfile
RUN yarn install --frozen-lockfile

# Build the necessary workspace
RUN yarn workspace @zkdb/serverless build

USER appuser

# Build the necessary workspaces
RUN yarn workspace @zkdb/storage build && \
    yarn workspace @zkdb/serverless build

# Use our customized image based on Node.js 20 slim image as a runner
FROM orochinetwork/node:20-alpine AS runner

# Create a non-root user and group in the runner stage
RUN addgroup -S appuser && adduser -S -G appuser -h /usr/src/app appuser

# Set the working directory
WORKDIR /usr/src/app

# Copy the application code and node_modules from the builder stage
COPY --from=builder /usr/src/app/packages/storage /usr/src/app/packages/storage
COPY --from=builder /usr/src/app/packages/serverless /usr/src/app/packages/serverless
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/package.json /usr/src/app/package.json
COPY --from=builder /usr/src/app/yarn.lock /usr/src/app/yarn.lock

# Ensure the non-root user owns the working directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser

# Set the entrypoint to the application
ENTRYPOINT ["node", "packages/serverless/build/src/index.js"]
