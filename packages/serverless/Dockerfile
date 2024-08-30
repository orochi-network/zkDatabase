# Use the official Node.js 20 slim image as a base
FROM orochinetwork/node:20-iron

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

# Set the working directory for the serverless package
WORKDIR /usr/src/app/packages/serverless

# Set the entrypoint to the application
ENTRYPOINT ["node", "build/src/index.js"]