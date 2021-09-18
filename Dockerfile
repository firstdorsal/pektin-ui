# 0. build stage
FROM node:alpine as build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN sh scripts/install-modules.sh
RUN yarn build

# 1. execution stage
FROM nginx:alpine
COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY ./server/nginx.conf /etc/nginx/conf.d/default.conf
