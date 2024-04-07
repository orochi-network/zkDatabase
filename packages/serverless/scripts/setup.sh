#!/bin/bash

# Define the target directory for the key file
TARGET_DIR="${PWD}/../mongo-keyfile"

# Create a temporary directory for the key file
TEMP_DIR=$(mktemp -d)

# Generate the key file in the temporary directory
KEY_FILE="${TEMP_DIR}/rs_keyfile"
openssl rand -base64 756 > "${KEY_FILE}"
chmod 0400 "${KEY_FILE}"
chown 999:999 "${KEY_FILE}"

# Create the target directory if it doesn't exist
mkdir -p "${TARGET_DIR}"

# Move the key file to the target directory
mv "${KEY_FILE}" "${TARGET_DIR}/rs_keyfile"

# Clean up the temporary directory
rm -rf "${TEMP_DIR}"

echo "Key file setup complete."
