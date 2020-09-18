#!/bin/bash

git checkout trunk
git pull
npm run docker:down
echo "y" | docker system prune -a
npm run docker:build
npm run docker:up
