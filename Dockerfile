FROM node:carbon

# install pm2
RUN npm install pm2 -g

# create app directory
WORKDIR /usr/src/app

# install app dependencies
COPY server/package.json server/yarn.lock ./server/

# install all deps
RUN cd server && yarn install --production=false

# bundle app source
COPY server/tsconfig.release.json ./server/
COPY tsconfig.json ./
COPY server/src ./server/src
COPY server/crd ./server/crd

# build lib
RUN cd server && npm run build:prod

# install prod-only deps this time
RUN cd server && yarn install --production=true

# delete app src
RUN rm -rf server/src

# bundle client
COPY client ./client

# install and build
RUN cd client && yarn && npm run build

# check installed pkg in client
RUN cd client && yarn list --pattern canner

# leave only dist
RUN cd client && ls | grep -v dist | xargs rm -rf

EXPOSE 3000
CMD [ "pm2-docker", "server/lib/bin/www.js" ]
