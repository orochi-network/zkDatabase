# Use our customized image based on Node.js 20 slim image as a base
FROM orochinetwork/node:22-bookworm AS builder

# Create a non-root user and group early in the Dockerfile
RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -s /bin/bash -d /usr/src/app appuser


# Set the working directory
WORKDIR /usr/src/app

# Ensure the non-root user owns the working directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser

# Copy the application code as the non-root user
COPY --chown=appuser:appuser . .

USER root

# Install dependencies with a frozen lockfile and secret npmrc
RUN --mount=type=secret,id=npm,target=/root/.npmrc yarn install --frozen-lockfile

USER appuser

# Build the necessary workspaces
RUN yarn workspace @zkdb/common build && \
    yarn workspace @zkdb/permission build && \ 
    yarn workspace @zkdb/smart-contract build && \
    yarn workspace @zkdb/storage build && \
    yarn workspace @zkdb/mina-service build

# Use our customized image based on Node.js 20 slim image as a runner
FROM orochinetwork/node:22-bookworm AS runner

# Create a non-root user and group in the runner stage
RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -s /bin/bash -d /usr/src/app appuser

# Set the working directory
WORKDIR /usr/src/app

# Copy the built application and node_modules from the builder stage
COPY --from=builder --chown=appuser:appuser /usr/src/app/packages/common /usr/src/app/packages/common
COPY --from=builder --chown=appuser:appuser /usr/src/app/packages/permission /usr/src/app/packages/permission
COPY --from=builder --chown=appuser:appuser /usr/src/app/packages/smart-contract /usr/src/app/packages/smart-contract
COPY --from=builder --chown=appuser:appuser /usr/src/app/packages/storage /usr/src/app/packages/storage
COPY --from=builder --chown=appuser:appuser /usr/src/app/packages/mina-service /usr/src/app/packages/mina-service
COPY --from=builder --chown=appuser:appuser /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder --chown=appuser:appuser /usr/src/app/package.json /usr/src/app/package.json
COPY --from=builder --chown=appuser:appuser /usr/src/app/yarn.lock /usr/src/app/yarn.lock

# Switch to the non-root user
USER appuser

# Set the working directory for the proof service
WORKDIR /usr/src/app/packages/mina-service

# Set the entrypoint to the application
ENTRYPOINT ["node", "build/src/index.js"]
