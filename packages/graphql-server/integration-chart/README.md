## Integeration environment

The chart helps you to create an integeration environment for GraphQL integeration tests. 


### Create environment

```
./start-kind-for-test.sh
```

It will use the kind to create a local cluster and run helm to install the chart that includes

* minio service (NodePort: 9000)
* keycloak service (NodePort: 8080)


### Destroy environment

```
kind delete cluster
```
