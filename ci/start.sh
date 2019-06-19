#!/bin/bash
# Portions Copyright 2016 The Kubernetes Authors All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

mount --make-shared /

export CNI_BRIDGE_NETWORK_OFFSET="0.0.1.0"
/dindnet &> /var/log/dind.log 2>&1 < /dev/null &

dockerd \
  --host=unix:///var/run/docker.sock \
  --host=tcp://0.0.0.0:2375 \
  &> /var/log/docker.log 2>&1 < /dev/null &

# This is a workaround to fix gitlab-runner hostname is compatible with the k8s resource name regex
# The original runner hostname is like runner-d6z5egv_-project-7509791-concurrent-0
echo "Changing hostname: "
hostname
echo "gitlab-runner" > /etc/hostname
hostname gitlab-runner
echo "172.17.0.2 gitlab-runner" >> /etc/hosts
echo "Hostname changed:"
hostname

# minikube couldn't work anymore

# /minikube start --vm-driver=none --bootstrapper=localkube --cpus 4 --memory 8192  --extra-config=apiserver.Authorization.Mode=RBAC &> /var/log/minikube-start.log 2>&1 < /dev/null
# /minikube addons enable default-storageclass
# /minikube addons enable ingress
# echo "$(/minikube ip) id.mycrop.local admin.mycrop.local" >> /etc/hosts

#kubectl config view --merge=true --flatten=true > /kubeconfig


# it is time to use kind
echo "install kind"

curl -sLo kind https://github.com/kubernetes-sigs/kind/releases/download/v0.3.0/kind-linux-amd64 && \
  chmod a+x kind && \
  mv kind /usr/local/bin
kind create cluster --name="kind"

echo "overrite $HOME/.kube/config"
cp $(kind get kubeconfig-path --name="kind") $HOME/.kube/config
