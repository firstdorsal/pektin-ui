# 0. build stage
FROM node:alpine
WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY ./ /app/
RUN yarn build

FROM nginx:alpine
COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY --from=build-stage /app/server/nginx.conf /etc/nginx/conf.d/default.conf
