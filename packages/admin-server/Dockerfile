FROM node:dubnium-slim AS build

RUN npm i -g lerna

# create app directory
WORKDIR /usr/src/app

# Copy
COPY lerna.json package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/admin-server packages/admin-server
COPY packages/client packages/client

RUN lerna bootstrap

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN cd packages/admin-server \
  && npm run build:prod \
  && cd ../client \
  && npm run build \
  && yarn list --pattern canner \
  && ls | grep -v dist | xargs rm -rf

RUN lerna bootstrap -- --production

# Run
FROM node:dubnium-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/admin-server/lib/bin/www.js" ]
