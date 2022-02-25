#!/bin/bash
yarn fix-modules
yarn build
xdg-open "http://localhost:4002"

docker-compose -f scripts/nginx.yml up