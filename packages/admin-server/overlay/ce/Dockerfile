FROM node:carbon-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY lerna.json package.json tsconfig.json tslint.json yarn.lock ./
COPY packages/admin-server packages/admin-server
COPY packages/client packages/client

RUN npx lerna bootstrap

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN cd packages/admin-server \
  && npm run build:prod \
  && cd ../client \
  && npm run build:ce \
  && yarn list --pattern canner \
  && ls | grep -v dist | xargs rm -rf

RUN npx lerna bootstrap -- --production

# Run
FROM node:carbon-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "packages/admin-server/lib/bin/www.js" ]
