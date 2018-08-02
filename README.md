# infuseai canner
## Folder architecture
### Server
Graphql API and hosting cms pages

### Client
Canner CMS

## Requirement
* keycloak

## Build
```sh
// install deps and build under client folder
$ cd ./client && yarn && npm run build

// cd back to project dir
$ cd ../

// install deps and build under server folder
$ cd ./server && yarn && npm run build:prod

// start server
$ npm run start:prod
```

