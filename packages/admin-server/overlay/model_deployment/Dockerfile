FROM node:14-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/admin-server packages/admin-server
COPY packages/client packages/client

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN  yarn install \
  && cd packages/admin-server \
  && yarn build:prod \
  && cd ../client \
  && yarn build:model_deploy \
  && ls | grep -v dist | xargs rm -rf

# Run
FROM node:14-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/admin-server/lib/bin/www.js" ]
