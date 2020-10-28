#!/bin/bash

export BIND_ADDRESS=10.88.88.88

export CLUSTER_NAME=primehub
export KC_DOMAIN=hub.ci-e2e.dev.primehub.io
export KC_PORT=$(($RANDOM % 50000 + 10000))
export KC_CHART_VERSION=7.2.1
export NGINX_INGRESS_CHART_VERSION=1.31.0
export K8S_VERSION=v1.17.7-k3s1
export NODE_VERSION=v10

wait_for_docker() {
  local now=$SECONDS
  local timeout=600
  while true; do
    # it might fail
    echo "checking docker"
    set +e
    docker info > /dev/null 2>&1
    ret=$?
    set -e
    if [ "$ret" == "0" ]; then
      echo "docker is available now"
      break
    fi
    if (( $SECONDS - now > $timeout )); then
      return 1
    fi
    sleep 5
  done
  return 0
}

wait_for_pod() {
  local name=$1
  local now=$SECONDS
  local timeout=600
  while true; do
    # it might fail
    echo "Checking ${name} up..."
    set +e
    kubectl get pods -l app.kubernetes.io/name=${name} | grep "1/1" > /dev/null 2>&1
    ret=$?
    set -e
    if [ "$ret" == "0" ]; then
      echo "${name} is available now"
      break
    fi
    if (( $SECONDS - now > $timeout )); then
      return 1
    fi
    sleep 10
  done
  return 0
}

check_commands() {
  if [ ! command -v k3d &> /dev/null ]; then
    echo "please install k3d: https://k3d.io/"
    exit 1
  fi

  if [ ! command -v kubectl &> /dev/null ]; then
    echo "please install kubectl"
    exit 1
  fi

  if [ ! command -v helm &> /dev/null ]; then
    echo "please install helm"
    exit 1
  fi
}

setup_k3d() {
  k3d version

  # Create k3d
  k3d create cluster ${CLUSTER_NAME} --image rancher/k3s:${K8S_VERSION} --k3s-server-arg '--disable=traefik' --k3s-server-arg '--disable-network-policy' --wait
  mkdir -p ~/.kube
  cp $(k3d get kubeconfig ${CLUSTER_NAME}) ~/.kube/config || true

  echo "waiting for nodes ready"
  until kubectl get nodes | grep ' Ready'
  do
    sleep 2
  done

  # Helm
  echo "show helm version"
  helm version

  # Wait for metrics api to be available
  kubectl --namespace=kube-system wait --for=condition=Available --timeout=5m apiservices/v1beta1.metrics.k8s.io

  # nginx
  echo "init nginx-ingress"
  helm repo add stable https://kubernetes-charts.storage.googleapis.com
  helm install nginx-ingress stable/nginx-ingress --create-namespace --namespace nginx-ingress --version=${NGINX_INGRESS_CHART_VERSION} --set controller.hostNetwork=true

  (
    kubectl -n nginx-ingress rollout status deploy/nginx-ingress-controller &&
    kubectl -n nginx-ingress rollout status deploy/nginx-ingress-default-backend &&
    kubectl port-forward -n nginx-ingress svc/nginx-ingress-controller ${KC_PORT}:80 --address ${BIND_ADDRESS} > /dev/null 2>&1
  )&
}

setup_keycloak() {
  cat <<EOF > keycloak-values.yaml
keycloak:
  replicas: 1
  password: keycloak

  persistence:
    deployPostgres: true
    dbVendor: postgres
    dbName: keycloak
    dbHost: 127.0.0.1
    dbPort: 5432
    dbUser: keycloak
    dbPassword: PASSWORDFORCIBUILD
  service:
    type: ClusterIP

  ingress:
    enabled: true
    path: /
    annotations:
      kubernetes.io/ingress.class: nginx
      kubernetes.io/ingress.allow-http: "true"
      ingress.kubernetes.io/affinity: cookie
    hosts:
      - ${KC_DOMAIN}
    tls: []

postgresql:
  postgresqlPassword: PASSWORDFORCIBUILD
  persistence:
    enabled: true
EOF

  helm repo add codecentric https://codecentric.github.io/helm-charts
  helm install keycloak codecentric/keycloak --version ${KC_CHART_VERSION} --values keycloak-values.yaml
  sleep 30
  wait_for_pod "keycloak"
}

# enable docker in docker
echo "start docker in docker"
sudo ci/start.sh &
sudo ifconfig lo:0 inet ${BIND_ADDRESS} netmask 0xffffff00

wait_for_docker
check_commands
setup_k3d
setup_keycloak

echo "run integration tests"
source ~/.bashrc
nvm install ${NODE_VERSION} --lts
npm install -g yarn

cd ~/project/packages/graphql-server
cat <<EOF > ci.env
K8S_CRD_NAMESPACE=default
KC_API_BASEURL=http://${KC_DOMAIN}:${KC_PORT}/auth
EOF
set -a; source ci.env; set +a

yarn install
yarn test:integration
