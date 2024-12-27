#!/usr/bin/env bash

ROOT_DIR=`pwd`
find `pwd` -name "node_modules" -exec rm -rf {} \;
# rm -rf yarn.lock
yarn
cd $ROOT_DIR/packages/permission && yarn build
cd $ROOT_DIR/packages/common && yarn build
cd $ROOT_DIR/packages/storage && yarn build
cd $ROOT_DIR/packages/serverless && yarn build
cd $ROOT_DIR/packages/api && yarn build
cd $ROOT_DIR/packages/zkdb && yarn build