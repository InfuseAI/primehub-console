#!/bin/bash
#


chk_url() {
  status=$(curl -s -o /dev/null --connect-timeout 10 -w "%{http_code}" $1)
  echo "[$status] $1"
  if [[ ! $status =~ [23].. ]]; then return 1; fi
}

endpoints=(
  http://keycloak.local:8080
)

now=$SECONDS
timeout=900

for endpoint in "${endpoints[@]}"; do
  echo "try $endpoint"
  until chk_url $endpoint; do
    if (( $SECONDS - now > $timeout )); then
      echo "timeout ${timeout}s"
      exit 1;
    fi  
    sleep 5;
  done;
done;
