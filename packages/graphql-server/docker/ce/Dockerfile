FROM node:14-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/graphql-server packages/graphql-server

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN  yarn install \
  && cd packages/graphql-server \
  && yarn build:ce:prod \
  && rm -rf server/src

# Run
FROM node:14-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/graphql-server/lib/bin/www.js" ]
