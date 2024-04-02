#!/bin/bash

cd ..

cd packages/storage
yarn link
cd ../..

cd projects/serverless
yarn link @zkdb/storage
cd ../proof-service
yarn link @zkdb/storage

cd ../..
