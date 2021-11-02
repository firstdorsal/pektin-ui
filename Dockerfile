# 0. build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN sh scripts/install-modules.sh
RUN yarn build

# 1. execution stage
FROM nginx:alpine
ENV CSP_CONNECT_SRC=*
COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY ./server/nginx.conf.template /etc/nginx/templates/default.conf.template
