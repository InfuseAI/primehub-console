#!/bin/bash

export K3D_VERSION=5.4.6
export K8S_VERSION=v1.24.3-k3s1
export KUBECTL_VERSION=1.24.3
export KC_VERSION=8.0.1
export NODE_VERSION=14.17.0
export CLUSTER_NAME=primehub

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

setup_k3d() {
  echo "┌──────────────────────┐"
  echo "│ Run local kubernetes │"
  echo "└──────────────────────┘"

  # Install kubectl
  curl -sLO https://storage.googleapis.com/kubernetes-release/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
    chmod a+x kubectl && \
    sudo mv kubectl /usr/local/bin

  # Install k3d
  curl -sLo k3d https://github.com/k3d-io/k3d/releases/download/v${K3D_VERSION}/k3d-linux-amd64 && \
    chmod +x k3d && \
    sudo mv k3d /usr/local/bin/

  k3d version

  # Create k3d
  k3d cluster create ${CLUSTER_NAME} --image rancher/k3s:${K8S_VERSION} --k3s-arg '--disable=traefik' --k3s-arg '--disable-network-policy' --wait
  mkdir -p ~/.kube
  cp $(k3d kubeconfig get ${CLUSTER_NAME}) ~/.kube/config || true

  echo "kube context: $(kubectl config current-context)"
  echo "waiting for nodes ready"
  until kubectl get nodes | grep ' Ready'
  do
    sleep 2
  done
}

setup_minio() {
  echo "┌────────────────────┐"
  echo "│ Setup MinIO        │"
  echo "└────────────────────┘"
  mkdir -p minio_data
  docker run -d --rm -p 9000:9000 -v `pwd`/minio_data:/data minio/minio server /data
}

setup_keycloak() {
  echo "┌────────────────────┐"
  echo "│ Run local keycloak │"
  echo "└────────────────────┘"
  docker run -d --rm --name keycloak \
    -p 8080:8080 \
    -e KEYCLOAK_USER=keycloak \
    -e KEYCLOAK_PASSWORD=keycloak \
    jboss/keycloak:8.0.1
}

run_test() {
  echo "┌──────────────────────┐"
  echo "│ Run integration test │"
  echo "└──────────────────────┘"
  source ~/.bashrc
  nvm install ${NODE_VERSION} --lts
  npm install -g yarn

  cd ~/project/packages/graphql-server
  yarn install
  yarn test:integration
}

wait_for_docker
setup_k3d
setup_keycloak
setup_minio
run_test
