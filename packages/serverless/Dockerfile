# Use our customized image based on Node.js 20 slim image as a base
FROM orochinetwork/node:20-iron

# Create a non-root user and group early in the Dockerfile
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/bash -d /usr/src/app appuser

# Set the working directory
WORKDIR /usr/src/app

# Ensure the non-root user owns the working directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser

# Copy the application code as the non-root user, including .env.example
COPY --chown=appuser:appuser . .

USER root

# Install dependencies with the exported environment variables
RUN --mount=type=secret,id=npm,target=/root/.npmrc yarn install --frozen-lockfile

USER appuser

# Build the necessary workspaces
RUN yarn workspace @zkdb/storage build && \
    yarn workspace @zkdb/serverless build

# Set the working directory for the broker service
WORKDIR /usr/src/app/packages/serverless

# Set the entrypoint to the application
ENTRYPOINT ["node", "build/src/index.js"]
