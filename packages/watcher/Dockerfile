FROM node:14-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/graphql-server packages/graphql-server
COPY packages/watcher packages/watcher

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN  yarn install \
  && cd packages/graphql-server \
  && yarn build:prod \
  && cd ../watcher \
  && yarn build:prod

# Run
FROM node:14-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/watcher/lib/bin/www.js" ]
