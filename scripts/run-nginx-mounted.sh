#!/bin/bash
yarn build

docker-compose -f scripts/nginx.yml up


