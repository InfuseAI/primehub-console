#!/bin/bash

sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get -yy -q --no-install-recommends install \
  iptables \
  ebtables \
  ethtool \
  ca-certificates \
  conntrack \
  socat \
  git \
  nfs-common \
  glusterfs-client \
  cifs-utils \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg2 \
  software-properties-common \
  bridge-utils \
  ipcalc \
  aufs-tools \
  sudo \
  openssh-client \
  build-essential \
  net-tools
sudo DEBIAN_FRONTEND=noninteractive apt-get clean
sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install kubectl
curl -sLO https://storage.googleapis.com/kubernetes-release/release/v1.17.7/bin/linux/amd64/kubectl && \
  chmod a+x kubectl && \
  sudo mv kubectl /usr/local/bin

K3D_VERSION=3.0.0-rc.6
HELM_VERSION=3.3.4

# Install k3d
curl -sLo k3d https://github.com/rancher/k3d/releases/download/v${K3D_VERSION}/k3d-linux-amd64 && \
  chmod +x k3d && \
  sudo mv k3d /usr/local/bin/

# Install helm
curl -ssL https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz | tar -xz --strip-components 1 linux-amd64/helm && \
  chmod +x helm && \
  sudo mv helm /usr/local/bin
