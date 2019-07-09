# canner-sidecar-watcher

## Env variables
* KC_API_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. Ex: 'http://127.0.0.1:8080/auth'. For API usage.
* KC_OIDC_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. For oidc usage.
* KC_REALM: the realm name of keycloak
* KC_EVERYONE_GROUP_ID: the everyone group id in keycloak
* K8S_CRD_NAMESPACE: specify what namespace to use for crd
* KC_CLIENT_SECRET: client secret
* KC_CLIENT_ID: client id
* KC_MAX_SOCKETS: Maximum number of sockets to allow per host. Default = 80
* KC_MAX_FREE_SOCKETS: Maximum number of sockets (per host) to leave open in a free state. Default = 10
* KC_ROLE_PREFIX: Prefix will be append at role when creating custom resource, for example: `cluster-1:ds:dataset` if `KC_ROLE_PREFIX` = `cluster-1`.

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
