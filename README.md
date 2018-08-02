# infuseai canner
## Folder architecture
### Server
Graphql API and hosting cms pages

### Client
Canner CMS

## Requirement
* keycloak
  * create a admin user, put username/password of the user to env variables: `KC_USERNAME`, `KC_PWD`
  * create an `everyone` group and put the group id to env variable: `KC_EVERYONE_GROUP_ID`
* kubernetes

## Env variables
* KC_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. Ex: 'http://127.0.0.1:8080/auth'
* KC_REALM: the realm name of keycloak
* KC_USERNAME: the admin username in keycloak
* KC_PWD: the password of amdin user in keycloak
* KC_EVERYONE_GROUP_ID: the everyone group id in keycloak

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

## Docker run
After building the image, here's an example of docker run cmd
```sh
docker run -e KC_REALM=demo -e KC_USERNAME=wwwy3y3 -e KC_PWD=wwwy3y3 -e KC_EVERYONE_GROUP_ID=f10dcedf-b7b3-498e-a4e4-e50f73449cf9 -e KC_BASEURL=http://docker.for.mac.localhost:8080/auth -p 3000:3000 --name canner-infuseai <image id>
```

If you want to connect to local minikube, here's a simple way: simply mount the config folder to docker container. For example:
```sh
docker run -v ~/.kube:/root/.kube -v ~/.minikube:/Users/williamchang/.minikube -e KC_REALM=demo -e KC_USERNAME=wwwy3y3 -e KC_PWD=wwwy3y3 -e KC_EVERYONE_GROUP_ID=f10dcedf-b7b3-498e-a4e4-e50f73449cf9 -e KC_BASEURL=http://docker.for.mac.localhost:8080/auth -p 3000:3000 --name canner-infuseai <image id>
```
