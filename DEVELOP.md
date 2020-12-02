# Development

## Develop on local

We recommend to use node version 10 lts for primehub-console development, you can use [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to install and manage differnet node runtime on the local machine.

```shell
$ nvm install v10
```

First, make sure you have node enviroment and install yarn in your local machine already.

```shell
$ npm install -g yarn
$ cd path/to/primehub-console
$ yarn install
```
### Overview

In PrimeHub Console, we have 4 sub components in `packages`, the web server, graphql server, front-end client and watcher.
All components can run as a standalone server for test individual, you also can combine them together as a compelete primehub-console on the local machine.

### Graphql dev server

#### Prerequisite

For graphql local server, we need an exist primehub cluster includes all primehub crd and keycloak component, please see our [primehub ce](https://github.com/InfuseAI/primehub) for more details about primehub cluster installation.

#### Start the local primehub-console-graphql

1. Go to `packages/graphql-server` and install the dependencies of the graphql sub component

    ```shell
    $ cd ./packages/graphql-server
    $ yarn install
    ```

2. Setup the required env variable

    * KC_API_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. Ex: 'http://127.0.0.1:8080/auth'. For API usage.
    * KC_OIDC_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. For oidc usage.
    * KC_REALM: the realm name of keycloak
    * KC_EVERYONE_GROUP_ID: the everyone group id in keycloak
    * K8S_CRD_NAMESPACE: specify what namespace to use for crd
    * KC_GRANT_TYPE: `password` or `authorization_code`
    * KC_CLIENT_SECRET: client secret
    * KC_CLIENT_ID: client id
    * SHARED_GRAPHQL_SECRET_KEY: secret key to request read-only graphql with. Client should put this shared key in header `Authorization: "Bearer <SHARED_GRAPHQL_SECRET_KEY>"`
    * APP_PREFIX: ex: `/admin
    You can check the graphql deployment's env setup as an example for local enviroment setup in your local cluster by following command
    ```shell
    $ kubectl describe deploy -n hub primehub-graphql
    Name:                   primehub-graphql
    Namespace:              hub
    ...
    Pod Template:
      ...
      Enviroment:
        KC_API_BASEURL: ...
        KC_OIDC_BASEURL: ...
        # etc.
       ...
    ```

3. Start the CE server.

    ```
    $ yarn start:ce
    ```

4. Open the graphql playground on browser.

    In default development setup, we enable graphql playground for standalone graphql server, you can use it for test graphql query manually, please go to server host after server     launched.


## Folder architecture
### Server
Graphql API and hosting cms pages

### Client

`packages/client`

## Requirement
* keycloak
  * create a admin user, put username/password of the user to env variables: `KC_USERNAME`, `KC_PWD`
  * create an `everyone` group and put the group id to env variable: `KC_EVERYONE_GROUP_ID`
* kubernetes

## Env variables
### Graphql-server
* KC_API_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. Ex: 'http://127.0.0.1:8080/auth'. For API usage.
* KC_OIDC_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. For oidc usage.
* KC_REALM: the realm name of keycloak
* KC_EVERYONE_GROUP_ID: the everyone group id in keycloak
* K8S_CRD_NAMESPACE: specify what namespace to use for crd
* KC_GRANT_TYPE: `password` or `authorization_code`
* KC_CLIENT_SECRET: client secret
* KC_CLIENT_ID: client id
* KC_MAX_SOCKETS: Maximum number of sockets to allow per host. Default = 80
* KC_MAX_FREE_SOCKETS: Maximum number of sockets (per host) to leave open in a free state. Default = 10
* KC_ROLE_PREFIX: Prefix will be append at role when creating custom resource, for example: `cluster-1:ds:dataset` if `KC_ROLE_PREFIX` = `cluster-1`.
* SHARED_GRAPHQL_SECRET_KEY: secret key to request read-only graphql with. Client should put this shared key in header `Authorization: "Bearer <SHARED_GRAPHQL_SECRET_KEY>"`
* APP_PREFIX: ex: `/admin`
* CMS_APP_PREFIX: the `APP_PREFIX` env setup in `admin-server`
* APOLLO_TRACING: (boolean) default: false
* GRAPHQL_PLAYGROUND: (boolean) default: false
* DEFAULT_USER_VOLUME_CAPACITY: (string) default: `20G`
* PRIMEHUB_GROUP_SC: for pvc
* PRIMEHUB_FEATURE_DATASET_UPLOAD: enable upload feature or not
* GRAPHQL_HOST: graphql public host, ex: `https://test.graphql.com:8080`
* MAX_GROUP: (int) default: 999, Maximum number of user group
* EXPIRED: (string) default: invalid
* LICENSED_TO: (string) License destination
* STARTED_AT: (string) License started time
* EXPIRED_AT: (string) License end time
* PRIMEHUB_GROUP_VOLUME_STORAGE_CLASS: storageClass of group pvc

### admin-server
* KC_API_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. Ex: 'http://127.0.0.1:8080/auth'. For API usage.
* KC_OIDC_BASEURL: BaseUrl of keycloak, should be postfix with `/auth`. For oidc usage.
* KC_REALM: the realm name of keycloak
* KC_CLIENT_SECRET: client secret
* KC_CLIENT_ID: client id
* KC_EVERYONE_GROUP_ID: the everyone group id in keycloak
* CANNER_LOCALE: language of cms, default to `en`
* CANNER_CMS_HOST: cms host, default to `http://localhost:3000`, DO NOT postfix with a slash.
* KC_MAX_SOCKETS: Maximum number of sockets to allow per host. Default = 80
* KC_MAX_FREE_SOCKETS: Maximum number of sockets (per host) to leave open in a free state. Default = 10
* GRAPHQL_ENDPOINT: graphql endpoint, format: `http://localhost:3001/graphql`
* APP_PREFIX: ex: `/admin`
* PRIMEHUB_FEATURE_USER_PORTAL: (boolean) default: `false`
* PORTAL_CONFIG_PATH: (string) default: `<project-dir>/server/etc/portal-config.yaml`
* READ_ONLY_ON_INSTANCE_TYPE_AND_IMAGE: (boolean) default false. whether we only allow read operations and group-assignment on instanceType/image form.
* PRIMEHUB_FEATURE_DATASET_UPLOAD: enable upload feature or not
* PRIMEHUB_FEATURE_CUSTOM_IMAGE: enable custom image or not
* PRIMEHUB_FEATURE_MODEL_DEPLOYMENT: enable model deployment

### watcher
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

## Test

### Graphql-server

**Unit test**

```sh
$ cd packages/graphql-server
$ yarn test:unit
```

**Integration test**

Run local keycloak
```sh
$ docker run -d --rm --name keycloak \
    -p 8080:8080 \
    -e KEYCLOAK_USER=wwwy3y3 \
    -e KEYCLOAK_PASSWORD=wwwy3y3 \
    jboss/keycloak
```

Run local kuberentes cluster by k3d
```sh
// isntall k3d
$ brew install k3d
$ k3d create
$ export KUBECONFIG="$(k3d get-kubeconfig --name='k3s-default')"

// wait for the node ready
$ kubectl get nodes
```

Run integration test
```sh
$ yarn test
```

> Note: please run the integration test on local dev kuberentes, or it may delete the CRDs in the cluster.

## Docker run
After building the image, here's an example of docker run cmd
```sh
docker run -e KC_REALM=demo -e KC_USERNAME=wwwy3y3 -e KC_PWD=wwwy3y3 -e KC_EVERYONE_GROUP_ID=f10dcedf-b7b3-498e-a4e4-e50f73449cf9 -e KC_BASEURL=http://docker.for.mac.localhost:8080/auth -p 3000:3000 --name canner-infuseai <image id>
```

If you want to connect to local minikube, here's a simple way: simply mount the config folder to docker container. For example:
```sh
docker run -v ~/.kube:/root/.kube -v ~/.minikube:/Users/williamchang/.minikube -e KC_REALM=demo -e KC_USERNAME=wwwy3y3 -e KC_PWD=wwwy3y3 -e KC_EVERYONE_GROUP_ID=f10dcedf-b7b3-498e-a4e4-e50f73449cf9 -e KC_BASEURL=http://docker.for.mac.localhost:8080/auth -p 3000:3000 --name canner-infuseai <image id>
```

## Style customization document
* [Link](client/README.md#override-antd-style)

## Manual
### How to use with keycloak oidc
```sh
export KC_GRANT_TYPE=authorization_code
export KC_CLIENT_SECRET=<your client secret>
export KC_CLIENT_ID=<your client id>
```

Simply visit `http://localhost:3000/cms`, an authenticated user will be redirected to keycloak login portal.

### How to change cms language
Change `CANNER_LOCALE` to `en` or `zh`

### About observer
To start observer, you must set `KC_USERNAME` & `KC_PASSWORD`, because observer will rely on these credentials obtain token from keycloak itself.

### Create fake users/groups
```sh
$ npm run build:prod

// add groups. default count is 500
$ node ./lib/bin/addGroups --count=10 --baseUrl=http://localhost:8080/auth --user=user --pwd=password --clientId=admin-cli --realm=master

// add users. default count is 500
$ node ./lib/bin/addUsers --count=10 --baseUrl=http://localhost:8080/auth --user=user --pwd=password --clientId=admin-cli --realm=master

// add all users to at least [min] count of groups, at most [max] count of groups.
$ node ./lib/bin/addMembers --min=10 --max=20 --baseUrl=http://localhost:8080/auth --user=user --pwd=password --clientId=admin-cli --realm=master
```

