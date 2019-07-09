FROM node:carbon-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY lerna.json package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/graphql-server packages/graphql-server
COPY packages/watcher packages/watcher

RUN npx lerna bootstrap --scope=@infuseai/watcher

RUN cd packages/watcher \
  && npm run build:prod \
  && cd ../graphql-server \
  && npm run build:prod

RUN npx lerna bootstrap --scope=@infuseai/watcher -- --production

# Run
FROM node:carbon-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/watcher/lib/bin/www.js" ]
