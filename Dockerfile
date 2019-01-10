FROM node:carbon-slim AS build

# create app directory
WORKDIR /usr/src/app

# Copy
COPY . .

RUN cd server \
  && yarn install --production=false \
  && npm run build:prod \
  && yarn install --production=true \
  && rm -rf server/src \
  && cd ../client \
  && yarn \
  && npm run build \
  && yarn list --pattern canner \
  && ls | grep -v dist | xargs rm -rf

# Run
FROM node:carbon-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
ENV NODE_ENV production
EXPOSE 3000
CMD [ "node", "server/lib/bin/www.js" ]
