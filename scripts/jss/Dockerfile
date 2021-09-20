# 0. build stage
FROM node as build-stage
WORKDIR /app
RUN git clone https://github.com/pektin-dns/pektin-ui .
RUN yarn
RUN yarn build

# 1. execution stage
FROM nginx:alpine
COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY --from=build-stage /app/server/nginx.conf /etc/nginx/conf.d/default.conf
