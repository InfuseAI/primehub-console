FROM node:carbon-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY lerna.json package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/graphql-server packages/graphql-server

RUN cd packages/graphql-server \
  && yarn install --ignore-engines --production=false \
  && npm run build:prod \
  && yarn install --ignore-engines --production=true \
  && rm -rf server/src

# Run
FROM node:carbon-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/graphql-server/lib/bin/www.js" ]
