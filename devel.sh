#!/usr/bin/env bash

tmux new-session 'cd packages/permission && npx rollup -c -w' \; \
    split-window -h 'cd packages/common && npx rollup -c -w' \; \
    split-window -h 'cd packages/api && npx rollup -c -w' \; \
    split-window -h  'cd packages/storage && npx rollup -c -w' \; \
    select-layout 'tiled'
