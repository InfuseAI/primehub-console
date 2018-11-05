FROM node:carbon-slim

# create app directory
WORKDIR /usr/src/app

# Copy
COPY . .

RUN npm install pm2 -g \
  && cd server \
  && yarn install --production=false \
  && npm run build:prod \
  && yarn install --production=true \
  && rm -rf server/src \
  && cd ../client \
  && yarn \
  && npm run build \
  && yarn list --pattern canner \
  && ls | grep -v dist | xargs rm -rf

EXPOSE 3000
CMD [ "pm2-docker", "server/lib/bin/www.js" ]
